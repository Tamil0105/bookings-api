import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(data: Partial<Booking>) {
    const booking = this.bookingRepository.create({
      ...data,
      status: data.status || BookingStatus.CONFIRMED,
      createdAt: new Date(),
    });
    return this.bookingRepository.save(booking);
  }

  async findAllByUser(userId: string) {
    return this.bookingRepository.find({
      where: { userId } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }

  async findAll() {
    return this.bookingRepository.find({
      order: { createdAt: 'DESC' } as any,
    });
  }
}
