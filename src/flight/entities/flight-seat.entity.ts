import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FlightClass {
  ECONOMY = 'ECONOMY',
  BUSINESS = 'BUSINESS',
  FIRST = 'FIRST',
}

export enum FlightSeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
}

@Entity('flight_seats')
export class FlightSeat {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  scheduleId: string;

  @Column()
  seatNumber: string; // e.g., 12A, 1B

  @Column({
    type: 'enum',
    enum: FlightClass,
    default: FlightClass.ECONOMY,
  })
  class: FlightClass;

  @Column({
    type: 'enum',
    enum: FlightSeatStatus,
    default: FlightSeatStatus.AVAILABLE,
  })
  status: FlightSeatStatus;

  @Column({ nullable: true })
  lockedUntil?: Date;

  @Column({ nullable: true })
  bookedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
