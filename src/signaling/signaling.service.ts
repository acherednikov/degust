import { Injectable, Logger } from '@nestjs/common';

/**
 * Метаданные участника комнаты.
 * Хранятся в памяти сервера. Не содержат ничего, что нельзя потерять
 * при рестарте — источник истины по факту присутствия всегда Socket.IO.
 */
export interface Peer {
  socketId: string;
  userId: string;
  displayName: string;
  muted: boolean;
  joinedAt: number;
}

@Injectable()
export class SignalingService {
  private readonly logger = new Logger(SignalingService.name);

  /**
   * roomId -> Map<socketId, Peer>
   *
   * Map, а не объект — потому что:
   *  - ключи-строки с необычными символами безопасны (нет конфликта с __proto__);
   *  - встроенные .size, .delete, .values() без Object.keys;
   *  - порядок вставки сохраняется (важно для дебага).
   */
  private readonly rooms = new Map<string, Map<string, Peer>>();

  // ─────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────

  addPeer(roomId: string, peer: Peer): void {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Map();
      this.rooms.set(roomId, room);
      this.logger.log(`Room created: ${roomId}`);
    }

    if (room.has(peer.socketId)) {
      this.logger.warn(
        `Peer ${peer.socketId} already exists in room ${roomId}, overwriting`,
      );
    }

    room.set(peer.socketId, peer);
  }

  removePeer(roomId: string, socketId: string): Peer | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const peer = room.get(socketId);
    if (!peer) return undefined;

    room.delete(socketId);

    // Пустые комнаты не держим — иначе карта пухнет от мусора
    if (room.size === 0) {
      this.rooms.delete(roomId);
      this.logger.log(`Room removed (empty): ${roomId}`);
    }

    return peer;
  }

  // ─────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────

  getPeers(roomId: string): Peer[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.values());
  }

  getPeer(roomId: string, socketId: string): Peer | undefined {
    return this.rooms.get(roomId)?.get(socketId);
  }

  /**
   * Обратный поиск: в какой комнате сидит сокет.
   *
   * O(n) по количеству комнат, но:
   *  - вызывается только на disconnect и join-room, не в горячем пути;
   *  - если комнат станет реально много (десятки тысяч) — заменим на
   *    вторичный Map<socketId, roomId>, который ведётся параллельно.
   */
  findRoomBySocket(socketId: string): string | undefined {
    for (const [roomId, peers] of this.rooms) {
      if (peers.has(socketId)) return roomId;
    }
    return undefined;
  }

  // ─────────────────────────────────────────────────────────────
  // Diagnostics
  // ─────────────────────────────────────────────────────────────

  getStats() {
    let totalPeers = 0;
    for (const room of this.rooms.values()) {
      totalPeers += room.size;
    }
    return {
      rooms: this.rooms.size,
      peers: totalPeers,
    };
  }
}
