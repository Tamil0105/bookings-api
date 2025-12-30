import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('shows')
export class Show {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  screenId: string;

  @Column()
  movieName: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
