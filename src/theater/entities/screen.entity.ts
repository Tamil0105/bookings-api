import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('screens')
export class Screen {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  theaterId: string;

  @Column()
  name: string;

  @Column()
  rows: number;

  @Column()
  cols: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
