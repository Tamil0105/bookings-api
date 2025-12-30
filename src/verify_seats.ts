import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TheaterService } from './theater/theater.service';
import { Seat } from './theater/entities/seat.entity';

async function verifySeats() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const theaterService = app.get(TheaterService);

  console.log('--- Verifying Theater Seats ---');

  // 1. Create Theater, Screen, Show
  const theater = await theaterService.createTheater({ name: 'Debug Theater', location: 'Debug Loc' });
  const screen = await theaterService.createScreen({ 
    theaterId: theater.id.toString(), 
    name: 'Debug Screen', 
    rows: 2, 
    cols: 2 
  });
  console.log('Screen created:', screen.id, 'Rows:', screen.rows, 'Cols:', screen.cols);

  const show = await theaterService.createShow({ 
    screenId: screen.id.toString(), 
    movieName: 'Debug Movie', 
    startTime: new Date(), 
    endTime: new Date(), 
    price: 10 
  });
  console.log('Show created:', show.id);

  // 2. Fetch Seats
  const seats = await theaterService.getShowSeats(show.id.toString());
  console.log(`Seats found for show: ${seats.length}`);
  
  if (seats.length === 4) {
    console.log('SUCCESS: Correct number of seats created.');
    seats.forEach(s => console.log(`- Seat ${s.row}${s.number} (${s.status})`));
  } else {
    console.log('FAILURE: Incorrect seat count.');
  }

  await app.close();
}

verifySeats();
