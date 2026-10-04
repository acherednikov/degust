import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';

import { Room } from '../rooms/room.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  displayName: string;

  @OneToMany(() => Room, (room) => room.createdBy)
  createdRooms: Room[];

  @ManyToMany(() => Room, (room) => room.users)
  @JoinTable()
  rooms: Room[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
