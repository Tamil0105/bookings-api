import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('train_trips')
export class TrainTrip {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  trainId: string;

  @Column()
  originStationId: string;

  @Column()
  destinationStationId: string;

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
