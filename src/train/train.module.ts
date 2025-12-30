import { Module } from '@nestjs/common';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Train } from './entities/train.entity';
import { Station } from './entities/station.entity';
import { TrainTrip } from './entities/train-trip.entity';
import { TrainSeat } from './entities/train-seat.entity';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Train, Station, TrainTrip, TrainSeat]),
    AuthModule,
    BookingsModule,
  ],
  controllers: [TrainController],
  providers: [TrainService],
})
export class TrainModule {}
