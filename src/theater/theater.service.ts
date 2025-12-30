import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Theater } from './entities/theater.entity';
import { Screen } from './entities/screen.entity';
import { Show } from './entities/show.entity';
import { Seat, SeatStatus } from './entities/seat.entity';
import { ObjectId } from 'mongodb';
import { BookingsService } from '../bookings/bookings.service';
import { BookingType, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class TheaterService {
  constructor(
    @InjectRepository(Theater)
    private readonly theaterRepository: Repository<Theater>,
    @InjectRepository(Screen)
    private readonly screenRepository: Repository<Screen>,
    @InjectRepository(Show)
    private readonly showRepository: Repository<Show>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    private readonly bookingsService: BookingsService,
  ) {}

  async createTheater(data: Partial<Theater>) {
    return this.theaterRepository.save(this.theaterRepository.create(data));
  }

  async deleteShow(id: string) {
    const show = await this.showRepository.findOne({ where: { _id: new ObjectId(id) } as any });
    if (!show) throw new NotFoundException('Show not found');
    await this.showRepository.delete({ _id: new ObjectId(id) } as any);
    return { message: 'Show deleted successfully' };
  }

  async createScreen(data: { theaterId: string; name: string; rows: number; cols: number }) {
    const screen = this.screenRepository.create(data);
    return this.screenRepository.save(screen);
  }

  async createShow(data: { screenId: string; movieName: string; startTime: Date; endTime: Date; price: number }) {
    const screen = await this.screenRepository.findOne({ where: { _id: new ObjectId(data.screenId) } as any });
    if (!screen) throw new NotFoundException('Screen not found');

    const show = await this.showRepository.save(this.showRepository.create(data));

    // Initialize seats for the show
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
    await this.seatRepository.save(this.seatRepository.create(seats));

    return show;
  }

  async findAllTheaters() {
    return this.theaterRepository.find();
  }

  async findShowsByTheater(theaterId: string) {
    const screens = await this.screenRepository.find({ where: { theaterId } });
    const screenIds = screens.map(s => s.id.toString());
    return this.showRepository.find({ 
      where: { 
        screenId: { $in: screenIds } as any 
      } 
    });
  }

  async getScreens(theaterId: string) {
    return this.screenRepository.find({ where: { theaterId } });
  }

  async getShowSeats(showId: string) {
    // Release expired locks before returning
    await this.releaseExpiredLocks(showId);
    console.log(showId,"showId");
    return await this.seatRepository.find({ where: { showId } });
  }

  async lockSeat(seatId: string, userId: string) {
    const seat = await this.seatRepository.findOne({ where: { _id: new ObjectId(seatId) } as any });
    if (!seat) throw new NotFoundException('Seat not found');

    if (seat.status !== SeatStatus.AVAILABLE) {
      if (seat.status === SeatStatus.LOCKED && seat.lockedUntil && seat.lockedUntil < new Date()) {
        // Lock expired, proceed
      } else {
        throw new ConflictException('Seat is not available');
      }
    }

    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 10); // 10 minutes lock

    const result = await this.seatRepository.update(
      {
        _id: new ObjectId(seatId),
        $or: [
          { status: SeatStatus.AVAILABLE },
          { status: SeatStatus.LOCKED, lockedUntil: { $lt: new Date() } }
        ]
      } as any,
      {
        status: SeatStatus.LOCKED,
        lockedUntil,
        bookedBy: userId,
      },
    );

    if (result.affected === 0) throw new ConflictException('Failed to lock seat');
    return { message: 'Seat locked for 10 minutes', lockedUntil };
  }

  async confirmBooking(seatIds: string[], userId: string) {
    const objectIds = seatIds.map(id => new ObjectId(id));
    // Verify ownership and status first
    const validSeats = await this.seatRepository.find({
      where: {
        _id: { $in: objectIds } as any,
        status: SeatStatus.LOCKED,
        bookedBy: userId,
      } as any
    });

    if (validSeats.length !== seatIds.length) {
      throw new BadRequestException('Some seats could not be confirmed. They might have expired or were not locked by you.');
    }

    // Proceed to update
    await this.seatRepository.update(
      { _id: { $in: objectIds } } as any,
      {
        status: SeatStatus.BOOKED,
        lockedUntil: null as any,
      },
    );

    const seats = validSeats;
    const showId = seats[0]?.showId;
    const show = await this.showRepository.findOne({ where: { _id: new ObjectId(showId) } as any });

    await this.bookingsService.create({
      userId,
      type: BookingType.THEATER,
      status: BookingStatus.CONFIRMED,
      totalAmount: (show?.price || 0) * seatIds.length,
      items: {
        showId,
        seatIds,
        seats: seats.map(s => `${s.row}${s.number}`),
        startTime: show?.startTime,
        movieName: show?.movieName,
      }
    });

    return { message: 'Booking confirmed' };
  }

  private async releaseExpiredLocks(showId: string) {
    await this.seatRepository.update(
      {
        showId,
        status: SeatStatus.LOCKED,
        lockedUntil: { $lt: new Date() } as any,
      } as any,
      {
        status: SeatStatus.AVAILABLE,
        lockedUntil: null as any,
        bookedBy: null as any,
      },
    );
  }
}
