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

import { Train } from './train/entities/train.entity';
import { Station } from './train/entities/station.entity';
import { TrainTrip } from './train/entities/train-trip.entity';
import { TrainSeat, TrainSeatStatus, TrainSeatType } from './train/entities/train-seat.entity';

import { Flight } from './flight/entities/flight.entity';
import { Airport } from './flight/entities/airport.entity';
import { FlightSchedule } from './flight/entities/flight-schedule.entity';
import { FlightSeat } from './flight/entities/flight-seat.entity';

import { Theater } from './theater/entities/theater.entity';
import { Screen } from './theater/entities/screen.entity';
import { Show } from './theater/entities/show.entity';
import { Seat, SeatStatus } from './theater/entities/seat.entity';
import { CalendarSlot, SlotStatus } from './calendar/entities/calendar-slot.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  
  const busRepository = app.get<Repository<Bus>>(getRepositoryToken(Bus));
  const routeRepository = app.get<Repository<Route>>(getRepositoryToken(Route));
  const tripRepository = app.get<Repository<Trip>>(getRepositoryToken(Trip));
  const busSeatRepository = app.get<Repository<BusSeat>>(getRepositoryToken(BusSeat));

  const trainRepository = app.get<Repository<Train>>(getRepositoryToken(Train));
  const stationRepository = app.get<Repository<Station>>(getRepositoryToken(Station));
  const trainTripRepository = app.get<Repository<TrainTrip>>(getRepositoryToken(TrainTrip));
  const trainSeatRepository = app.get<Repository<TrainSeat>>(getRepositoryToken(TrainSeat));

  const flightRepository = app.get<Repository<Flight>>(getRepositoryToken(Flight));
  const airportRepository = app.get<Repository<Airport>>(getRepositoryToken(Airport));
  const flightScheduleRepository = app.get<Repository<FlightSchedule>>(getRepositoryToken(FlightSchedule));

  const theaterRepository = app.get<Repository<Theater>>(getRepositoryToken(Theater));
  const screenRepository = app.get<Repository<Screen>>(getRepositoryToken(Screen));
  const showRepository = app.get<Repository<Show>>(getRepositoryToken(Show));
  const seatRepository = app.get<Repository<Seat>>(getRepositoryToken(Seat));

  console.log('--- Cleaning Database ---');
  // Simple check and delete if needed, or just insert. For seed, strict reset is better but unsafe for prod.
  // Assuming dev environment.
  
  // 1. Users
  console.log('Seeding Users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = (await userRepository.findOne({ where: { email: 'admin@example.com' } })) || (await userRepository.save({
    email: 'admin@example.com',
    password: hashedPassword,
    name: 'Admin User',
    role: UserRole.ADMIN,
  } as any));

  const normalUser = (await userRepository.findOne({ where: { email: 'user@example.com' } })) || (await userRepository.save({
    email: 'user@example.com',
    password: hashedPassword,
    name: 'John Doe',
    role: UserRole.USER,
  } as any));

  // 2. Bus Module
  console.log('Seeding Bus Module...');
  const route = await routeRepository.save({
    source: 'New York',
    destination: 'Boston',
    distance: 350,
    duration: '4h 30m',
    waypoints: ['New Haven', 'Providence'],
  } as any);

  const bus = await busRepository.save({
    busNumber: 'BUS-101',
    name: 'Greyhound',
    type: 'AC Sleeper',
    capacity: 40,
  } as any);

  const trip = await tripRepository.save({
    busId: bus.id.toString(),
    routeId: route.id.toString(),
    departureTime: new Date(new Date().setHours(10, 0, 0, 0)),
    arrivalTime: new Date(new Date().setHours(14, 30, 0, 0)),
    price: 45,
  } as any);

  // Seed some bus seats for the trip
  const busSeatsData: Partial<BusSeat>[] = [];
  const decks = ['L', 'U']; // Lower, Upper
  for (let i = 1; i <= 20; i++) {
     busSeatsData.push({
         tripId: trip.id.toString(),
         seatNumber: `L${i}`,
         status: BusSeatStatus.AVAILABLE,
         isSleeper: true,
     });
      busSeatsData.push({
         tripId: trip.id.toString(),
         seatNumber: `U${i}`,
         status: BusSeatStatus.AVAILABLE,
         isSleeper: true,
     });
  }
  await busSeatRepository.save(busSeatsData as any);


  // 3. Train Module
  console.log('Seeding Train Module...');
  const station1 = await stationRepository.save({
    code: 'NYP', name: 'Penn Station', city: 'New York', state: 'NY'
  } as any);
  const station2 = await stationRepository.save({
    code: 'WAS', name: 'Union Station', city: 'Washington', state: 'DC'
  } as any);

  const train = await trainRepository.save({
    trainNumber: 'TR-202', name: 'Acela Express', type: 'High Speed'
  } as any);

  const trainTrip = await trainTripRepository.save({
    trainId: train.id.toString(),
    originStationId: station1.id.toString(),
    destinationStationId: station2.id.toString(),
    departureTime: new Date(new Date().setHours(8, 0, 0, 0)),
    arrivalTime: new Date(new Date().setHours(11, 0, 0, 0)),
    basePrice: 85,
  } as any);

  // Seed some train seats
  const trainSeatsData: Partial<TrainSeat>[] = [];
  ['A1', 'A2', 'B1'].forEach(coach => {
      for(let i=1; i<=20; i++) {
          trainSeatsData.push({
              tripId: trainTrip.id.toString(), // Corrected from trainTripId
              coachNumber: coach,
              seatNumber: `${coach}-${i}`, // Corresponds to string type
              seatType: TrainSeatType.WINDOW, // Simplified
              status: TrainSeatStatus.AVAILABLE, // Corrected from TrainSeatStatus
              // price: 85 // TrainSeat doesn't have price in entity? Checked entity: NO price.
          })
      }
  });
  await trainSeatRepository.save(trainSeatsData as any);


  // 4. Flight Module
  console.log('Seeding Flight Module...');
  const airport1 = await airportRepository.save({
    code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA'
  } as any);
  const airport2 = await airportRepository.save({
    code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK'
  } as any);

  const flight = await flightRepository.save({
    flightNumber: 'BA112', airline: 'British Airways', aircraftType: 'Boeing 777', totalSeats: 300
  } as any);

  const flightSchedule = await flightScheduleRepository.save({
    flightId: flight.id.toString(),
    originAirportId: airport1.id.toString(),
    destinationAirportId: airport2.id.toString(),
    departureTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    arrivalTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
    basePrice: 450,
  } as any);

  // Create seats for flight
  const flightSeats: Partial<FlightSeat>[] = [];
  const flightRows = 20;
  const seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F'];
  const FlightSeatStatusEnum = { AVAILABLE: 'AVAILABLE', LOCKED: 'LOCKED', BOOKED: 'BOOKED' }; // Hardcoding enum for seed simplicity or import
  // Better to import but let's try to trust imports are there or add them.
  // I need to import FlightSeat and FlightSeatStatus at the top first?
  // Checking imports... 
  // Line 21: import { FlightSchedule } from './flight/entities/flight-schedule.entity';
  // Missing FlightSeat imports.
  
  for (let r = 1; r <= flightRows; r++) {
      const seatClass = r <= 4 ? 'BUSINESS' : 'ECONOMY';
      for (const char of seatsPerRow) {
        flightSeats.push({
          scheduleId: flightSchedule.id.toString(),
          seatNumber: `${r}${char}`,
          class: seatClass,
          status: 'AVAILABLE', // Using string matching enum
        } as any);
      }
  }
  await app.get<Repository<FlightSeat>>(getRepositoryToken(FlightSeat)).save(flightSeats as any);


  // 5. Theater Module
  console.log('Seeding Theater Module...');
  const theater = await theaterRepository.save({
    name: 'Broadway Theater', location: 'New York, NY'
  } as any);

  const screen = await screenRepository.save({
    theaterId: theater.id.toString(), name: 'Main Hall', rows: 15, cols: 20
  } as any);

  const show = await showRepository.save({
    screenId: screen.id.toString(),
    movieName: 'The Lion King',
    // posterUrl: '...', // Not in entity
    startTime: new Date(new Date().setHours(19, 0, 0, 0)),
    endTime: new Date(new Date().setHours(21, 30, 0, 0)),
    price: 120,
  } as any);

  // Create seats for the show
  const seats: Partial<Seat>[] = [];
  for (let r = 0; r < screen.rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let c = 1; c <= screen.cols; c++) {
      seats.push({
        showId: show.id.toString(),
        row: rowLabel,
        number: c,
        status: SeatStatus.AVAILABLE,
      });
    }
  }
  await app.get<Repository<Seat>>(getRepositoryToken(Seat)).save(seats as any);

  // 6. Calendar Module
  console.log('Seeding Calendar Module...');
  const calendarSlotRepository = app.get<Repository<CalendarSlot>>(getRepositoryToken(CalendarSlot));
  const slots: Partial<CalendarSlot>[] = [];
  
  // Seed slots for today and tomorrow for Admin
  const today = new Date();
  today.setHours(9, 0, 0, 0); // Start at 9 AM
  
  for (let i = 0; i < 5; i++) { // 5 slots today
      const start = new Date(today);
      start.setHours(9 + i);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + 45); // 45 min slots

      slots.push({
          providerId: adminUser.id.toString(),
          startTime: start,
          endTime: end,
          status: SlotStatus.AVAILABLE,
      });
  }

  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  for (let i = 0; i < 5; i++) { 
      const start = new Date(tomorrow);
      start.setHours(9 + i);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + 45);

      slots.push({
          providerId: adminUser.id.toString(),
          startTime: start,
          endTime: end,
          status: SlotStatus.AVAILABLE,
      });
  }

  await calendarSlotRepository.save(slots as any);
  
  
  console.log('--- Seeding Completed ---');
  await app.close();
}

bootstrap();
