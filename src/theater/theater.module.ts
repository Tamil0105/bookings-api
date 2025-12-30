import { Module } from '@nestjs/common';
import { TheaterService } from './theater.service';
import { TheaterController } from './theater.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theater } from './entities/theater.entity';
import { Screen } from './entities/screen.entity';
import { Show } from './entities/show.entity';
import { Seat } from './entities/seat.entity';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Theater, Screen, Show, Seat]),
    AuthModule,
    BookingsModule,
  ],
  controllers: [TheaterController],
  providers: [TheaterService],
})
export class TheaterModule {}
