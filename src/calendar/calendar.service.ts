import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { CalendarSlot, SlotStatus } from './entities/calendar-slot.entity';
import { ObjectId } from 'mongodb';
import { BookingsService } from '../bookings/bookings.service';
import { BookingType, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarSlot)
    private readonly slotRepository: Repository<CalendarSlot>,
    private readonly bookingsService: BookingsService,
  ) {}

  async createSlot(providerId: string, startTime: Date, endTime: Date) {
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping slots
    const overlapping = await this.slotRepository.findOne({
      where: {
        providerId,
        startTime: LessThanOrEqual(endTime),
        endTime: MoreThanOrEqual(startTime),
      } as any,
    });

    if (overlapping) {
      throw new ConflictException('Slot overlaps with an existing one');
    }

    const slot = this.slotRepository.create({
      providerId,
      startTime,
      endTime,
      status: SlotStatus.AVAILABLE,
    });

    return this.slotRepository.save(slot);
  }

  async findAll(query: any) {
    const { providerId, availableOnly, startDate, endDate } = query;
    const where: any = {};

    if (providerId) where.providerId = providerId;
    if (availableOnly) where.status = SlotStatus.AVAILABLE;
    
    // Date range filtering for MongoDB could be more complex with TypeORM
    // simplified for now
    
    return this.slotRepository.find({ where });
  }

  async bookSlot(slotId: string, userId: string) {
    const slot = await this.slotRepository.findOne({
      where: { _id: new ObjectId(slotId) } as any,
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new ConflictException('Slot is no longer available');
    }

    // Atomic update to prevent race conditions
    const result = await this.slotRepository.update(
      {
        _id: new ObjectId(slotId),
        status: SlotStatus.AVAILABLE,
      } as any,
      {
        status: SlotStatus.BOOKED,
        bookedBy: userId,
      },
    );

    if (result.affected === 0) {
      throw new ConflictException('Slot was booked by another user');
    }

    await this.bookingsService.create({
      userId,
      type: BookingType.CALENDAR,
      status: BookingStatus.CONFIRMED,
      totalAmount: 0, // Assuming appointments are free or handled elsewhere? Defaulting to 0.
      items: {
        slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        providerId: slot.providerId,
      }
    });

    return { message: 'Slot successfully booked' };
  }

  async cancelBooking(slotId: string, userId: string, isAdmin: boolean) {
    const where: any = { _id: new ObjectId(slotId) };
    if (!isAdmin) where.bookedBy = userId;

    const slot = await this.slotRepository.findOne({ where });

    if (!slot) {
      throw new NotFoundException('Booking not found');
    }

    await this.slotRepository.update(slot.id, {
      status: SlotStatus.AVAILABLE,
      bookedBy: null as any,
    });

    return { message: 'Booking successfully cancelled' };
  }
}
