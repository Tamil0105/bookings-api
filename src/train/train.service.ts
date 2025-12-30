import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Train } from './entities/train.entity';
import { Station } from './entities/station.entity';
import { TrainTrip } from './entities/train-trip.entity';
import { TrainSeat, TrainSeatStatus, TrainSeatType } from './entities/train-seat.entity';
import { ObjectId } from 'mongodb';
import { BookingsService } from '../bookings/bookings.service';
import { BookingType, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class TrainService {
  constructor(
    @InjectRepository(Train)
    private readonly trainRepository: Repository<Train>,
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
    @InjectRepository(TrainTrip)
    private readonly tripRepository: Repository<TrainTrip>,
    @InjectRepository(TrainSeat)
    private readonly seatRepository: Repository<TrainSeat>,
    private readonly bookingsService: BookingsService,
  ) {}

  async createTrain(data: Partial<Train>) {
    return this.trainRepository.save(this.trainRepository.create(data));
  }

  async deleteTrain(id: string) {
    const train = await this.trainRepository.findOne({ where: { _id: new ObjectId(id) } as any });
    if (!train) throw new NotFoundException('Train not found');
    await this.trainRepository.delete({ _id: new ObjectId(id) } as any);
    return { message: 'Train deleted successfully' };
  }

  async createStation(data: Partial<Station>) {
    return this.stationRepository.save(this.stationRepository.create(data));
  }

  async createTrip(data: { trainId: string; originStationId: string; destinationStationId: string; departureTime: Date; arrivalTime: Date; basePrice: number }) {
    const train = await this.trainRepository.findOne({ where: { _id: new ObjectId(data.trainId) } as any });
    if (!train) throw new NotFoundException('Train not found');

    const trip = await this.tripRepository.save(this.tripRepository.create(data));

    // Initialize seats (e.g., 3 coaches, 20 seats each)
    const seats: Partial<TrainSeat>[] = [];
    const coaches = ['A1', 'B1', 'S1'];
    const seatTypes = Object.values(TrainSeatType);
    
    for (const coach of coaches) {
      for (let s = 1; s <= 20; s++) {
        seats.push({
          tripId: trip.id.toString(),
          coachNumber: coach,
          seatNumber: s.toString(),
          seatType: seatTypes[s % seatTypes.length],
          status: TrainSeatStatus.AVAILABLE,
        });
      }
    }
    await this.seatRepository.save(this.seatRepository.create(seats));

    return trip;
  }

  async searchTrips(originCode: string, destinationCode: string, date: Date) {
    const origin = await this.stationRepository.findOne({ where: { code: originCode.toUpperCase() } });
    const dest = await this.stationRepository.findOne({ where: { code: destinationCode.toUpperCase() } });
    
    if (!origin || !dest) return [];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.tripRepository.find({
      where: {
        originStationId: origin.id.toString(),
        destinationStationId: dest.id.toString(),
        departureTime: { $gte: startOfDay, $lte: endOfDay } as any,
      }
    });
  }

  async getTripSeats(tripId: string) {
    // Release expired locks
    await this.seatRepository.update(
      {
        tripId,
        status: TrainSeatStatus.LOCKED,
        lockedUntil: { $lt: new Date() } as any,
      } as any,
      {
        status: TrainSeatStatus.AVAILABLE,
        lockedUntil: null as any,
        bookedBy: null as any,
      },
    );
    return this.seatRepository.find({ where: { tripId } });
  }

  async lockSeat(seatId: string, userId: string) {
    const seat = await this.seatRepository.findOne({ where: { _id: new ObjectId(seatId) } as any });
    if (!seat) throw new NotFoundException('Seat not found');

    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 10);

    const result = await this.seatRepository.update(
      {
        _id: new ObjectId(seatId),
        $or: [
          { status: TrainSeatStatus.AVAILABLE },
          { status: TrainSeatStatus.LOCKED, lockedUntil: { $lt: new Date() } }
        ]
      } as any,
      {
        status: TrainSeatStatus.LOCKED,
        lockedUntil,
        bookedBy: userId,
      },
    );

    if (result.affected === 0) throw new ConflictException('Seat is already being booked');
    return { message: 'Seat locked', lockedUntil };
  }

  async confirmBooking(seatIds: string[], userId: string) {
    const objectIds = seatIds.map(id => new ObjectId(id));
    // Verify ownership and status first
    const validSeats = await this.seatRepository.find({
      where: {
        _id: { $in: objectIds } as any,
        status: TrainSeatStatus.LOCKED,
        bookedBy: userId,
      } as any
    });

    if (validSeats.length !== seatIds.length) {
      throw new BadRequestException('Booking failed. Availability changed.');
    }

    // Proceed to update
    await this.seatRepository.update(
      { _id: { $in: objectIds } } as any,
      {
        status: TrainSeatStatus.BOOKED,
        lockedUntil: null as any,
      },
    );

    const seats = validSeats;
    const tripId = seats[0]?.tripId;
    const trip = await this.tripRepository.findOne({ where: { _id: new ObjectId(tripId) } as any });

    await this.bookingsService.create({
      userId,
      type: BookingType.TRAIN,
      status: BookingStatus.CONFIRMED,
      totalAmount: (trip?.basePrice || 0) * seatIds.length,
      items: {
        tripId,
        seatIds,
        seats: seats.map(s => `${s.coachNumber}-${s.seatNumber}`),
        departureTime: trip?.departureTime,
        trainId: trip?.trainId,
      }
    });

    return { message: 'Train tickets confirmed' };
  }

  async findAllTrains() {
    return this.trainRepository.find();
  }

  async findAllStations() {
    return this.stationRepository.find();
  }

  async findAllTrips() {
    return this.tripRepository.find();
  }
}
