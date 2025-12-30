import { Module } from '@nestjs/common';
import { FlightService } from './flight.service';
import { FlightController } from './flight.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flight } from './entities/flight.entity';
import { Airport } from './entities/airport.entity';
import { FlightSchedule } from './entities/flight-schedule.entity';
import { FlightSeat } from './entities/flight-seat.entity';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flight, Airport, FlightSchedule, FlightSeat]),
    AuthModule,
    BookingsModule,
  ],
  controllers: [FlightController],
  providers: [FlightService],
})
export class FlightModule {}
