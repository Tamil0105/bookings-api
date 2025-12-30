import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from './auth/entities/user.entity';
import { Bus } from './bus/entities/bus.entity';
import { Route } from './bus/entities/route.entity';
import { Trip } from './bus/entities/trip.entity';
import { BusSeat, BusSeatStatus } from './bus/entities/bus-seat.entity';
import { BusService } from './bus/bus.service';

import { Flight } from './flight/entities/flight.entity';
import { Airport } from './flight/entities/airport.entity';
import { FlightSchedule } from './flight/entities/flight-schedule.entity';
import { FlightSeat, FlightSeatStatus } from './flight/entities/flight-seat.entity';
import { FlightService } from './flight/flight.service';

import { Booking } from './bookings/entities/booking.entity';

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const bookingRepository = app.get<Repository<Booking>>(getRepositoryToken(Booking));
  const busService = app.get(BusService);
  const flightService = app.get(FlightService);

  console.log('--- Starting Verification ---');

  // 1. Create Users
  const hashedPassword = await bcrypt.hash('pass', 10);
  const user = await userRepository.save({
    email: `testuser_${Date.now()}@example.com`,
    password: hashedPassword,
    name: 'Test User',
    role: UserRole.USER,
  } as any);
  console.log('User created:', user.id);

  // 2. Admin Actions (Simulated via Service calls directly which strictly don't enforce roles in script context, 
  // but we assume controllers guard them. We are testing the logic capability here.)
  
  // Create Bus Trip
  const bus = await busService.createBus({ name: 'Test Bus', capacity: 10, type: 'Sleeper' });
  const route = await busService.createRoute({ source: 'A', destination: 'B' });
  const trip = await busService.createTrip({
    busId: bus.id.toString(),
    routeId: route.id.toString(),
    departureTime: new Date(),
    arrivalTime: new Date(),
    price: 100
  });
  console.log('Bus Trip created:', trip.id);

  // Create Flight Schedule
  const airport1 = await flightService.createAirport({ code: 'AAA', name: 'Airport A', city: 'City A', country: 'CA' });
  const airport2 = await flightService.createAirport({ code: 'BBB', name: 'Airport B', city: 'City B', country: 'CB' });
  const flight = await flightService.createFlight({ flightNumber: 'TF1', airline: 'TestAir' });
  const schedule = await flightService.createSchedule({
    flightId: flight.id.toString(),
    originAirportId: airport1.id.toString(),
    destinationAirportId: airport2.id.toString(),
    departureTime: new Date(),
    arrivalTime: new Date(),
    basePrice: 200
  });
  console.log('Flight Schedule created:', schedule.id);

  // 3. User Actions - Booking
  console.log('--- Simulating User Booking ---');

  // Book Bus
  const busSeats = await busService.getTripSeats(trip.id.toString());
  const busSeatToBook = busSeats.find(s => s.status === BusSeatStatus.AVAILABLE);
  if (busSeatToBook) {
    await busService.lockSeat(busSeatToBook.id.toString(), user.id.toString());
    const lockedSeat = await busService.getTripSeats(trip.id.toString())
      .then(seats => seats.find(s => s.id.toString() === busSeatToBook.id.toString()));
    console.log('LOCKED SEAT DEBUG:', JSON.stringify(lockedSeat, null, 2));
    console.log('User ID Used:', user.id.toString());

    await busService.confirmBooking([busSeatToBook.id.toString()], user.id.toString());
    console.log('Bus Booking Confirmed');
  }

  // Book Flight
  const flightSeats = await flightService.getScheduleSeats(schedule.id.toString());
  const flightSeatToBook = flightSeats.find(s => s.status === FlightSeatStatus.AVAILABLE);
  if (flightSeatToBook) {
    await flightService.lockSeat(flightSeatToBook.id.toString(), user.id.toString());
    await flightService.confirmBooking([flightSeatToBook.id.toString()], user.id.toString());
    console.log('Flight Booking Confirmed');
  }

  // 4. Verification
  console.log('--- Verifying Central Bookings ---');
  const userBookings = await bookingRepository.find({ where: { userId: user.id.toString() } as any });
  console.log(`Found ${userBookings.length} bookings for user (Expected: 2)`);
  
  userBookings.forEach(b => {
    console.log(`- Type: ${b.type}, Status: ${b.status}, Amount: ${b.totalAmount}`);
  });

  if (userBookings.length === 2) {
    console.log('SUCCESS: Bookings integrated correctly.');
  } else {
    console.log('FAILURE: Bookings count mismatch.');
  }

  await app.close();
}

verify();
