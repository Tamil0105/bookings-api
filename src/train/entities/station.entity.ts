import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('stations')
export class Station {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  code: string; // e.g., NDLS, CSTM

  @Column()
  name: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
