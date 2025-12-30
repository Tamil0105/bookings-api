import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TrainSeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
}

export enum TrainSeatType {
  WINDOW = 'WINDOW',
  AISLE = 'AISLE',
  MIDDLE = 'MIDDLE',
}

@Entity('train_seats')
export class TrainSeat {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  tripId: string;

  @Column()
  coachNumber: string; // e.g., B1, A1, S1

  @Column()
  seatNumber: string;

  @Column({
    type: 'enum',
    enum: TrainSeatType,
    default: TrainSeatType.WINDOW,
  })
  seatType: TrainSeatType;

  @Column({
    type: 'enum',
    enum: TrainSeatStatus,
    default: TrainSeatStatus.AVAILABLE,
  })
  status: TrainSeatStatus;

  @Column({ nullable: true })
  lockedUntil?: Date;

  @Column({ nullable: true })
  bookedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
