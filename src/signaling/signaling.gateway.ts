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
        userId: payload.sub,
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
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const user = client.data.user; // ← из JWT, не из DTO
    if (!user) throw new WsException('Unauthorized');

    // На всякий случай: если сокет уже сидит в какой-то комнате — выкидываем
    const existingRoom = this.signaling.findRoomBySocket(client.id);
    if (existingRoom) {
      this.leaveRoom(client, existingRoom);
    }

    const peer: Peer = {
      socketId: client.id,
      userId: user.userId,
      displayName: user.displayName,
      muted: false,
      joinedAt: Date.now(),
    };

    client.join(dto.roomId);
    this.signaling.addPeer(dto.roomId, peer);

    const existingPeers = this.signaling
      .getPeers(dto.roomId)
      .filter((p) => p.socketId !== client.id);

    // Новому — список уже присутствующих, чтобы он знал, с кем инициировать
    client.emit('room-joined', {
      roomId: dto.roomId,
      selfSocketId: client.id,
      peers: existingPeers,
    });

    // Остальным — что пришёл новый участник
    client.to(dto.roomId).emit('peer-joined', peer);

    this.logger.log(
      `User ${user.userId} joined room ${dto.roomId} (socket: ${client.id})`,
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