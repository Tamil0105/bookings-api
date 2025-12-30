import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './auth/entities/user.entity';
import { Bus } from './bus/entities/bus.entity';
import { Train } from './train/entities/train.entity';
import { Flight } from './flight/entities/flight.entity';
import { Theater } from './theater/entities/theater.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const busRepository = app.get<Repository<Bus>>(getRepositoryToken(Bus));
  const trainRepository = app.get<Repository<Train>>(getRepositoryToken(Train));
  const flightRepository = app.get<Repository<Flight>>(getRepositoryToken(Flight));
  const theaterRepository = app.get<Repository<Theater>>(getRepositoryToken(Theater));

  console.log('--- Database Verification ---');
  console.log(`Users: ${await userRepository.count()}`);
  console.log(`Buses: ${await busRepository.count()}`);
  console.log(`Trains: ${await trainRepository.count()}`);
  console.log(`Flights: ${await flightRepository.count()}`);
  console.log(`Theaters: ${await theaterRepository.count()}`);
  
  await app.close();
}

bootstrap();
