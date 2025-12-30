import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { BusService } from './bus.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('bus')
@Controller('bus')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post()
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new bus' })
  createBus(@Body() body: any) {
    return this.busService.createBus(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all buses' })
  findAllBuses() {
    return this.busService.findAllBuses();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a bus' })
  deleteBus(@Param('id') id: string) {
    return this.busService.deleteBus(id);
  }

  @Post('routes')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new route' })
  createRoute(@Body() body: any) {
    return this.busService.createRoute(body);
  }

  @Post('trips')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new trip' })
  createTrip(@Body() body: any) {
    return this.busService.createTrip({
      ...body,
      departureTime: new Date(body.departureTime),
      arrivalTime: new Date(body.arrivalTime),
    });
  }

  @Get('routes')
  @ApiOperation({ summary: 'List all routes' })
  findAllRoutes() {
    return this.busService.findAllRoutes();
  }

  @Get('trips') // Ensure this doesn't conflict with search? controller prefix is 'bus', method path 'trips'. BusService findAllTrips
  @ApiOperation({ summary: 'List all trips' })
  findAllTrips() {
    return this.busService.findAllTrips();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for bus trips' })
  searchTrips(@Query('source') source: string, @Query('destination') destination: string, @Query('date') date: string) {
    return this.busService.searchTrips(source, destination, new Date(date));
  }

  @Get('trips/:tripId/seats')
  @ApiOperation({ summary: 'Get seats for a trip' })
  getTripSeats(@Param('tripId') tripId: string) {
    return this.busService.getTripSeats(tripId);
  }

  @Post('seats/:seatId/lock')
  @ApiOperation({ summary: 'Temporarily lock a bus seat' })
  lockSeat(@Param('seatId') seatId: string, @Req() req: any) {
    return this.busService.lockSeat(seatId, req.user.id);
  }

  @Put('bookings/confirm')
  @ApiOperation({ summary: 'Confirm bus booking' })
  confirmBooking(@Body() body: { seatIds: string[] }, @Req() req: any) {
    return this.busService.confirmBooking(body.seatIds, req.user.id);
  }
}
