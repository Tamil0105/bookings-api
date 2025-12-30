import { Module } from '@nestjs/common';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Route } from './entities/route.entity';
import { Trip } from './entities/trip.entity';
import { BusSeat } from './entities/bus-seat.entity';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bus, Route, Trip, BusSeat]),
    AuthModule,
    BookingsModule,
  ],
  controllers: [BusController],
  providers: [BusService],
})
export class BusModule {}
