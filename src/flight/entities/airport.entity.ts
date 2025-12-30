import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('airports')
export class Airport {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  code: string; // IATA code, e.g., JFK, DEL

  @Column()
  name: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
