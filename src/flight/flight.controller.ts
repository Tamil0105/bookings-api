import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { FlightService } from './flight.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('flight')
@Controller('flight')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FlightController {
  constructor(private readonly flightService: FlightService) {}

  @Post()
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new flight' })
  createFlight(@Body() body: any) {
    return this.flightService.createFlight(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all flights' })
  findAllFlights() {
    return this.flightService.findAllFlights();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a flight' })
  deleteFlight(@Param('id') id: string) {
    return this.flightService.deleteFlight(id);
  }

  @Post('airports')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new airport' })
  createAirport(@Body() body: any) {
    return this.flightService.createAirport(body);
  }

  @Post('schedules')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new flight schedule' })
  createSchedule(@Body() body: any) {
    return this.flightService.createSchedule({
      ...body,
      departureTime: new Date(body.departureTime),
      arrivalTime: new Date(body.arrivalTime),
    });
  }

  @Get('airports')
  @ApiOperation({ summary: 'List all airports' })
  findAllAirports() {
    return this.flightService.findAllAirports();
  }

  @Get('schedules')
  @ApiOperation({ summary: 'List all schedules' })
  findAllSchedules() {
    return this.flightService.findAllSchedules();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for flights' })
  searchFlights(@Query('origin') origin: string, @Query('destination') destination: string, @Query('date') date: string) {
    return this.flightService.searchFlights(origin, destination, new Date(date));
  }

  @Get('schedules/:scheduleId/seats')
  @ApiOperation({ summary: 'Get seats for a flight schedule' })
  getScheduleSeats(@Param('scheduleId') scheduleId: string) {
    return this.flightService.getScheduleSeats(scheduleId);
  }

  @Post('seats/:seatId/lock')
  @ApiOperation({ summary: 'Temporarily lock a flight seat' })
  lockSeat(@Param('seatId') seatId: string, @Req() req: any) {
    return this.flightService.lockSeat(seatId, req.user.id);
  }

  @Put('bookings/confirm')
  @ApiOperation({ summary: 'Confirm flight booking' })
  confirmBooking(@Body() body: { seatIds: string[] }, @Req() req: any) {
    return this.flightService.confirmBooking(body.seatIds, req.user.id);
  }
}
