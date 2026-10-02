import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import {
  UsePipes,
  ValidationPipe,
  Logger,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { JoinRoomDto } from './dto/join-room.dto.js';
import { OfferDto } from './dto/offer.dto.js';
import { AnswerDto } from './dto/answer.dto.js';
import { IceCandidateDto } from './dto/ice-candidate.dto.js';
import { type Peer, SignalingService } from './signaling.service.js';

import { WsAuthGuard } from '../auth/ws-auth.guard.js';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter.js';
import { RoomsRepository } from '../rooms/rooms.repository.js';

@UseFilters(new WsExceptionFilter())
@UseGuards(WsAuthGuard)
@UsePipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => new WsException(errors),
}))
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
  // namespace опционален; можно оставить по умолчанию '/'
  // namespace: 'signaling',
})
export class SignalingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SignalingGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly signaling: SignalingService,
    private readonly jwtService: JwtService,
    private readonly rooms: RoomsRepository,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────

  afterInit() {
    this.logger.log('SignalingGateway initialized');
  }

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      this.logger.warn(`No token, disconnecting ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = {
        userId: payload.sub,           // UUID из БД
        externalId: payload.externalId,
        displayName: payload.name,
      };
      this.logger.log(`Authenticated: ${payload.sub} (${client.id})`);
    } catch (err) {
      this.logger.warn(`Invalid token, disconnecting ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const roomId = this.signaling.findRoomBySocket(client.id);
    if (!roomId) {
      this.logger.log(`Client disconnected (not in room): ${client.id}`);
      return;
    }

    const peer = this.signaling.removePeer(roomId, client.id);

    // Уведомляем остальных в комнате
    client.to(roomId).emit('peer-left', {
      socketId: client.id,
      userId: peer?.userId,
    });

    this.logger.log(
      `Client ${client.id} left room ${roomId} (user: ${peer?.userId ?? 'unknown'})`,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Room lifecycle
  // ─────────────────────────────────────────────────────────────

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const user = client.data.user;
    if (!user) throw new WsException('Unauthorized');

    // 1. Сначала выкидываем из старой комнаты, если сидит
    const existingRoom = this.signaling.findRoomBySocket(client.id);
    if (existingRoom) {
      this.leaveRoom(client, existingRoom);
    }

    // 2. Теперь создаём/находим комнату в БД
    const room = await this.rooms.findOrCreate(dto.roomId);

    // 3. Ключ комнаты — room.name (он же dto.roomId, но берём из БД для консистентности)
    const roomKey = room.name;

    const peer: Peer = {
      socketId: client.id,
      userId: user.userId,
      displayName: user.displayName,
      muted: false,
      joinedAt: Date.now(),
    };

    client.join(roomKey);
    this.signaling.addPeer(roomKey, peer);

    // 4. Список уже присутствующих (без себя)
    const existingPeers = this.signaling
      .getPeers(roomKey)
      .filter((p) => p.socketId !== client.id);

    client.emit('room-joined', {
      roomId: roomKey,
      selfSocketId: client.id,
      peers: existingPeers,
    });

    client.to(roomKey).emit('peer-joined', peer);

    this.logger.log(
      `User ${user.userId} joined room ${roomKey} (socket: ${client.id})`,
    );
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const roomId = this.signaling.findRoomBySocket(client.id);
    if (!roomId) return;
    this.leaveRoom(client, roomId);
  }

  // ─────────────────────────────────────────────────────────────
  // WebRTC signaling relay
  // ─────────────────────────────────────────────────────────────

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: OfferDto,
  ) {
    this.logger.log(`[offer] ${client.id} → ${dto.targetSocketId}, sdp length: ${dto.sdp.length}`);
    this.server.to(dto.targetSocketId).emit('offer', {
      fromSocketId: client.id,
      sdp: dto.sdp,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AnswerDto,
  ) {
    this.logger.log(`[answer] ${client.id} → ${dto.targetSocketId}, sdp length: ${dto.sdp.length}`);
    this.server.to(dto.targetSocketId).emit('answer', {
      fromSocketId: client.id,
      sdp: dto.sdp,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: IceCandidateDto,
  ) {
    this.logger.log(`[ice-candidate] ${client.id} → ${dto.targetSocketId}, candidate length: ${dto.candidate.length}`);
    this.server.to(dto.targetSocketId).emit('ice-candidate', {
      fromSocketId: client.id,
      candidate: dto.candidate,
      sdpMid: dto.sdpMid,
      sdpMLineIndex: dto.sdpMLineIndex,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // UI state (mute/unmute, display name, etc.)
  // ─────────────────────────────────────────────────────────────

  @SubscribeMessage('toggle-mute')
  handleToggleMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { muted: boolean },
  ) {
    const roomId = this.signaling.findRoomBySocket(client.id);
    if (!roomId) return;

    const peer = this.signaling.getPeer(roomId, client.id);
    if (!peer) return;

    peer.muted = body.muted;

    client.to(roomId).emit('peer-muted', {
      socketId: client.id,
      muted: body.muted,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  private leaveRoom(client: Socket, roomId: string) {
    const peer = this.signaling.removePeer(roomId, client.id);
    client.leave(roomId);

    client.to(roomId).emit('peer-left', {
      socketId: client.id,
      userId: peer?.userId,
    });

    this.logger.log(
      `Client ${client.id} explicitly left room ${roomId} (user: ${peer?.userId ?? 'unknown'})`,
    );
  }
}