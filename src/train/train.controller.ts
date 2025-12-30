import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { TrainService } from './train.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('train')
@Controller('train')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  @Post()
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new train' })
  createTrain(@Body() body: any) {
    return this.trainService.createTrain(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all trains' })
  findAllTrains() {
    return this.trainService.findAllTrains();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a train' })
  deleteTrain(@Param('id') id: string) {
    return this.trainService.deleteTrain(id);
  }

  @Post('stations')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new station' })
  createStation(@Body() body: any) {
    return this.trainService.createStation(body);
  }

  @Post('trips')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new train trip' })
  createTrip(@Body() body: any) {
    return this.trainService.createTrip({
      ...body,
      departureTime: new Date(body.departureTime),
      arrivalTime: new Date(body.arrivalTime),
    });
  }

  @Get('stations')
  @ApiOperation({ summary: 'List all stations' })
  findAllStations() {
    return this.trainService.findAllStations();
  }

  @Get('trips')
  @ApiOperation({ summary: 'List all trips' })
  findAllTrips() {
    return this.trainService.findAllTrips();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for train journeys' })
  searchTrips(@Query('origin') origin: string, @Query('destination') destination: string, @Query('date') date: string) {
    return this.trainService.searchTrips(origin, destination, new Date(date));
  }

  @Get('trips/:tripId/seats')
  @ApiOperation({ summary: 'Get seats for a train trip' })
  getTripSeats(@Param('tripId') tripId: string) {
    return this.trainService.getTripSeats(tripId);
  }

  @Post('seats/:seatId/lock')
  @ApiOperation({ summary: 'Temporarily lock a train seat' })
  lockSeat(@Param('seatId') seatId: string, @Req() req: any) {
    return this.trainService.lockSeat(seatId, req.user.id);
  }

  @Put('bookings/confirm')
  @ApiOperation({ summary: 'Confirm train booking' })
  confirmBooking(@Body() body: { seatIds: string[] }, @Req() req: any) {
    return this.trainService.confirmBooking(body.seatIds, req.user.id);
  }
}
