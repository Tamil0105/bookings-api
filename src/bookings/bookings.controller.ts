import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  create(@Body() body: any, @Req() req: any) {
    return this.bookingsService.create({
      ...body,
      userId: req.user.id,
    });
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get my bookings' })
  findMyBookings(@Req() req: any) {
    return this.bookingsService.findAllByUser(req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings (Admin)' })
  findAll() {
    return this.bookingsService.findAll();
  }
}
