import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('flights')
export class Flight {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  airline: string;

  @Column()
  flightNumber: string;

  @Column()
  aircraftType: string;

  @Column()
  totalSeats: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
