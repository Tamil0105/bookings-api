import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flight } from './entities/flight.entity';
import { Airport } from './entities/airport.entity';
import { FlightSchedule } from './entities/flight-schedule.entity';
import { FlightSeat, FlightSeatStatus, FlightClass } from './entities/flight-seat.entity';
import { ObjectId } from 'mongodb';
import { BookingsService } from '../bookings/bookings.service';
import { BookingType, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class FlightService {
  constructor(
    @InjectRepository(Flight)
    private readonly flightRepository: Repository<Flight>,
    @InjectRepository(Airport)
    private readonly airportRepository: Repository<Airport>,
    @InjectRepository(FlightSchedule)
    private readonly scheduleRepository: Repository<FlightSchedule>,
    @InjectRepository(FlightSeat)
    private readonly seatRepository: Repository<FlightSeat>,
    private readonly bookingsService: BookingsService,
  ) {}

  async createFlight(data: Partial<Flight>) {
    return this.flightRepository.save(this.flightRepository.create(data));
  }

  async deleteFlight(id: string) {
    const flight = await this.flightRepository.findOne({ where: { _id: new ObjectId(id) } as any });
    if (!flight) throw new NotFoundException('Flight not found');
    await this.flightRepository.delete({ _id: new ObjectId(id) } as any);
    return { message: 'Flight deleted successfully' };
  }

  async createAirport(data: Partial<Airport>) {
    return this.airportRepository.save(this.airportRepository.create(data));
  }

  async createSchedule(data: { flightId: string; originAirportId: string; destinationAirportId: string; departureTime: Date; arrivalTime: Date; basePrice: number }) {
    const flight = await this.flightRepository.findOne({ where: { _id: new ObjectId(data.flightId) } as any });
    if (!flight) throw new NotFoundException('Flight not found');

    const schedule = await this.scheduleRepository.save(this.scheduleRepository.create(data));

    // Initialize seats (e.g., 20 rows, 6 seats per row)
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
    await this.seatRepository.save(this.seatRepository.create(seats));

    return schedule;
  }

  async searchFlights(originCode: string, destinationCode: string, date: Date) {
    const origin = await this.airportRepository.findOne({ where: { code: originCode.toUpperCase() } });
    const dest = await this.airportRepository.findOne({ where: { code: destinationCode.toUpperCase() } });
    
    if (!origin || !dest) return [];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.scheduleRepository.find({
      where: {
        originAirportId: origin.id.toString(),
        destinationAirportId: dest.id.toString(),
        departureTime: { $gte: startOfDay, $lte: endOfDay } as any,
      }
    });
  }

  async getScheduleSeats(scheduleId: string) {
    // Release expired locks
    await this.seatRepository.update(
      {
        scheduleId,
        status: FlightSeatStatus.LOCKED,
        lockedUntil: { $lt: new Date() } as any,
      } as any,
      {
        status: FlightSeatStatus.AVAILABLE,
        lockedUntil: null as any,
        bookedBy: null as any,
      },
    );
    return this.seatRepository.find({ where: { scheduleId } });
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
          { status: FlightSeatStatus.AVAILABLE },
          { status: FlightSeatStatus.LOCKED, lockedUntil: { $lt: new Date() } }
        ]
      } as any,
      {
        status: FlightSeatStatus.LOCKED,
        lockedUntil,
        bookedBy: userId,
      },
    );

    if (result.affected === 0) throw new ConflictException('Seat selection failed');
    return { message: 'Seat locked for 10 minutes', lockedUntil };
  }

  async confirmBooking(seatIds: string[], userId: string) {
    const objectIds = seatIds.map(id => new ObjectId(id));
    // Verify ownership and status first
    const validSeats = await this.seatRepository.find({
      where: {
        _id: { $in: objectIds } as any,
        status: FlightSeatStatus.LOCKED,
        bookedBy: userId,
      } as any
    });

    if (validSeats.length !== seatIds.length) {
      throw new BadRequestException('Booking confirmation failed. Some seats were released.');
    }

    // Proceed to update
    await this.seatRepository.update(
      { _id: { $in: objectIds } } as any,
      {
        status: FlightSeatStatus.BOOKED,
        lockedUntil: null as any,
      },
    );

    const seats = validSeats;
    const scheduleId = seats[0]?.scheduleId;
    const schedule = await this.scheduleRepository.findOne({ where: { _id: new ObjectId(scheduleId) } as any });
    
    // Calculate price based on class if needed, simple version here:
    const totalAmount = (schedule?.basePrice || 0) * seatIds.length;

    await this.bookingsService.create({
      userId,
      type: BookingType.FLIGHT,
      status: BookingStatus.CONFIRMED,
      totalAmount: (schedule?.basePrice || 0) * seatIds.length,
      items: {
        scheduleId,
        seatIds,
        seats: seats.map(s => `${s.seatNumber}`),
        departureTime: schedule?.departureTime,
        flightId: schedule?.flightId,
      }
    });

    return { message: 'Flight ticket confirmed' };
  }

  async findAllFlights() {
    return this.flightRepository.find();
  }

  async findAllAirports() {
    return this.airportRepository.find();
  }

  async findAllSchedules() {
    return this.scheduleRepository.find();
  }
}
