import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BookingType {
  CALENDAR = 'CALENDAR',
  THEATER = 'THEATER',
  BUS = 'BUS',
  FLIGHT = 'FLIGHT',
  TRAIN = 'TRAIN',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('bookings')
export class Booking {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: BookingType,
  })
  type: BookingType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column()
  totalAmount: number;

  @Column('simple-json')
  items: any; // Can store details like { seatIds: [], tripId: ... } or { slotId: ... }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
