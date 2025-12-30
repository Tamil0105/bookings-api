import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { Route } from './entities/route.entity';
import { Trip } from './entities/trip.entity';
import { BusSeat, BusSeatStatus } from './entities/bus-seat.entity';
import { ObjectId } from 'mongodb';
import { BookingsService } from '../bookings/bookings.service';
import { BookingType, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(BusSeat)
    private readonly seatRepository: Repository<BusSeat>,
    private readonly bookingsService: BookingsService,
  ) {}

  async createBus(data: Partial<Bus>) {
    return this.busRepository.save(this.busRepository.create(data));
  }

  async deleteBus(id: string) {
    const bus = await this.busRepository.findOne({ where: { _id: new ObjectId(id) } as any });
    if (!bus) throw new NotFoundException('Bus not found');
    await this.busRepository.delete({ _id: new ObjectId(id) } as any);
    return { message: 'Bus deleted successfully' };
  }

  async createRoute(data: Partial<Route>) {
    return this.routeRepository.save(this.routeRepository.create(data));
  }

  async createTrip(data: { busId: string; routeId: string; departureTime: Date; arrivalTime: Date; price: number }) {
    const bus = await this.busRepository.findOne({ where: { _id: new ObjectId(data.busId) } as any });
    if (!bus) throw new NotFoundException('Bus not found');

    const trip = await this.tripRepository.save(this.tripRepository.create(data));

    // Initialize seats for the trip
    const seats: Partial<BusSeat>[] = [];
    for (let i = 1; i <= bus.capacity; i++) {
      seats.push({
        tripId: trip.id.toString(),
        seatNumber: `${i}${i <= bus.capacity / 2 ? 'L' : 'U'}`, // L for Lower, U for Upper (Sleeper logic simple)
        isSleeper: bus.type.toLowerCase().includes('sleeper'),
        status: BusSeatStatus.AVAILABLE,
      });
    }
    await this.seatRepository.save(this.seatRepository.create(seats));

    return trip;
  }

  async searchTrips(source: string, destination: string, date: Date) {
    const routes = await this.routeRepository.find({
      where: {
        source: { $regex: new RegExp(source, 'i') } as any,
        destination: { $regex: new RegExp(destination, 'i') } as any,
      }
    });
    const routeIds = routes.map(r => r.id.toString());

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.tripRepository.find({
      where: {
        routeId: { $in: routeIds } as any,
        departureTime: { $gte: startOfDay, $lte: endOfDay } as any,
      }
    });
  }

  async getTripSeats(tripId: string) {
    // Release expired locks
    await this.seatRepository.update(
      {
        tripId,
        status: BusSeatStatus.LOCKED,
        lockedUntil: { $lt: new Date() } as any,
      } as any,
      {
        status: BusSeatStatus.AVAILABLE,
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
          { status: BusSeatStatus.AVAILABLE },
          { status: BusSeatStatus.LOCKED, lockedUntil: { $lt: new Date() } }
        ]
      } as any,
      {
        status: BusSeatStatus.LOCKED,
        lockedUntil,
        bookedBy: userId,
      },
    );

    if (result.affected === 0) throw new ConflictException('Seat is already taken');
    return { message: 'Seat locked', lockedUntil };
  }

  async confirmBooking(seatIds: string[], userId: string) {
    const objectIds = seatIds.map(id => new ObjectId(id));
    // Verify ownership and status first
    const validSeats = await this.seatRepository.find({
      where: {
        _id: { $in: objectIds } as any, // Cast for lint
        status: BusSeatStatus.LOCKED,
        bookedBy: userId,
      } as any
    });

    if (validSeats.length !== seatIds.length) {
      throw new BadRequestException('Booking failed. Some seats were not locked by you or have expired.');
    }

    // Proceed to update
    await this.seatRepository.update(
      { _id: { $in: objectIds } } as any,
      {
        status: BusSeatStatus.BOOKED,
        lockedUntil: null as any,
      },
    );

    // Find seats to calculate amount and getting trip info (we already have them in validSeats)
    const seats = validSeats;
    const tripId = seats[0]?.tripId;
    const trip = await this.tripRepository.findOne({ where: { _id: new ObjectId(tripId) } as any });

    await this.bookingsService.create({
      userId,
      type: BookingType.BUS,
      status: BookingStatus.CONFIRMED,
      totalAmount: (trip?.price || 0) * seatIds.length,
      items: {
        tripId,
        seatIds,
        seats: seats.map(s => `${s.seatNumber}`),
        departureTime: trip?.departureTime,
        busId: trip?.busId,
      }
    });

    return { message: 'Bus booking confirmed' };
  }

  async findAllBuses() {
    return this.busRepository.find();
  }

  async findAllRoutes() {
    return this.routeRepository.find();
  }

  async findAllTrips() { // Admin usage
    return this.tripRepository.find();
  }
}
