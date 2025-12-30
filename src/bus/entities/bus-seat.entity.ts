import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BusSeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
}

@Entity('bus_seats')
export class BusSeat {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  tripId: string;

  @Column()
  seatNumber: string;

  @Column()
  isSleeper: boolean;

  @Column({
    type: 'enum',
    enum: BusSeatStatus,
    default: BusSeatStatus.AVAILABLE,
  })
  status: BusSeatStatus;

  @Column({ nullable: true })
  lockedUntil?: Date;

  @Column({ nullable: true })
  bookedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
