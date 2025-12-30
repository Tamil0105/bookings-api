import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('trains')
export class Train {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  name: string;

  @Column()
  trainNumber: string;

  @Column()
  type: string; // e.g., Express, Superfast, Bullet

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
