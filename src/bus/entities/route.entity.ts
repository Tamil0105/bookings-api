import { Entity, Column, ObjectIdColumn, ObjectId, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('routes')
export class Route {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  source: string;

  @Column()
  destination: string;

  @Column('simple-array')
  waypoints: string[];

  @Column()
  distance: number;

  @Column()
  duration: string; // e.g., "5h 30m"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
