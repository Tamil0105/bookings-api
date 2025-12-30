import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
}

@Entity('seats')
export class Seat {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  showId: string;

  @Column()
  row: string;

  @Column()
  number: number;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column({ nullable: true })
  lockedUntil?: Date;

  @Column({ nullable: true })
  bookedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
