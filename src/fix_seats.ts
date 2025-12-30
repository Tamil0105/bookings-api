import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FlightService } from './flight/flight.service';
import { FlightSchedule } from './flight/entities/flight-schedule.entity';
import { FlightSeat, FlightSeatStatus, FlightClass } from './flight/entities/flight-seat.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusService } from './bus/bus.service';
import { BusSeat } from './bus/entities/bus-seat.entity';
import { TrainService } from './train/train.service';
import { TrainSeat } from './train/entities/train-seat.entity';
import { TheaterService } from './theater/theater.service';
import { Seat } from './theater/entities/seat.entity';

async function fixSeats() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('--- Checking for Missing Seats ---');

  // Flight Backfill
  const flightScheduleRepo = app.get<Repository<FlightSchedule>>(getRepositoryToken(FlightSchedule));
  const flightSeatRepo = app.get<Repository<FlightSeat>>(getRepositoryToken(FlightSeat));
  
  const schedules = await flightScheduleRepo.find();
  for (const schedule of schedules) {
    const count = await flightSeatRepo.count({ where: { scheduleId: schedule.id.toString() } });
    if (count === 0) {
      console.log(`Fixing Flight Schedule ${schedule.id}...`);
      const seats: Partial<FlightSeat>[] = [];
      const rows = 20;
      const seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (let r = 1; r <= rows; r++) {
        const seatClass = r <= 4 ? FlightClass.BUSINESS : FlightClass.ECONOMY;
        for (const char of seatsPerRow) {
          seats.push({
            scheduleId: schedule.id.toString(),
            seatNumber: `${r}${char}`,
            class: seatClass,
            status: FlightSeatStatus.AVAILABLE,
          });
        }
      }
      await flightSeatRepo.save(seats as any);
      console.log('Fixed.');
    }
  }

  // Bus Backfill
  // ... (similar logic can be added if needed, but primary missing one was Flight)
  
  // Theater Backfill
  const showRepo = app.get(TheaterService)['showRepository']; // Accessing via service if public or direct repo
  const seatRepo = app.get(TheaterService)['seatRepository'];
  // Actually easier to just use getRepositoryToken if I import entities
  // Skipping explicit loop for now unless requested, focusing on Flight which was visibly broken in seed.
  
  console.log('--- Done ---');
  await app.close();
}

fixSeats();
