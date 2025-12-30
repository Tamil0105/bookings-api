import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('buses')
export class Bus {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  name: string;

  @Column()
  busNumber: string;

  @Column()
  type: string; // e.g., AC, Non-AC, Sleeper

  @Column()
  capacity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
