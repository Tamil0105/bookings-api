import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('flight_schedules')
export class FlightSchedule {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  flightId: string;

  @Column()
  originAirportId: string;

  @Column()
  destinationAirportId: string;

  @Column()
  departureTime: Date;

  @Column()
  arrivalTime: Date;

  @Column()
  basePrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
