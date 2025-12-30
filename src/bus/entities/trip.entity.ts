import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('trips')
export class Trip {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  busId: string;

  @Column()
  routeId: string;

  @Column()
  departureTime: Date;

  @Column()
  arrivalTime: Date;

  @Column()
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
