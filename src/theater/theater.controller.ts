import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { TheaterService } from './theater.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('theater')
@Controller('theater')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TheaterController {
  constructor(private readonly theaterService: TheaterService) {}

  @Post()
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new theater' })
  createTheater(@Body() body: any) {
    return this.theaterService.createTheater(body);
  }

  @Delete('shows/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a show' })
  deleteShow(@Param('id') id: string) {
    return this.theaterService.deleteShow(id);
  }

  @Post('screens')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a screen in a theater' })
  createScreen(@Body() body: { theaterId: string; name: string; rows: number; cols: number }) {
    return this.theaterService.createScreen(body);
  }

  @Post('shows')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a show in a screen' })
  createShow(@Body() body: { screenId: string; movieName: string; startTime: string; endTime: string; price: number }) {
    return this.theaterService.createShow({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all theaters' })
  findAllTheaters() {
    return this.theaterService.findAllTheaters();
  }

  @Get(':theaterId/shows')
  @ApiOperation({ summary: 'List shows in a theater' })
  findShowsByTheater(@Param('theaterId') theaterId: string) {
    return this.theaterService.findShowsByTheater(theaterId);
  }

  @Get(':theaterId/screens')
  @ApiOperation({ summary: 'List screens in a theater' })
  getScreens(@Param('theaterId') theaterId: string) {
    return this.theaterService.getScreens(theaterId);
  }

  @Get('shows/:showId/seats')
  @ApiOperation({ summary: 'Get seats for a show' })
  getShowSeats(@Param('showId') showId: string) {
    return this.theaterService.getShowSeats(showId);
  }

  @Post('seats/:seatId/lock')
  @ApiOperation({ summary: 'Temporarily lock a seat' })
  lockSeat(@Param('seatId') seatId: string, @Req() req: any) {
    return this.theaterService.lockSeat(seatId, req.user.id);
  }

  @Put('bookings/confirm')
  @ApiOperation({ summary: 'Confirm booking for locked seats' })
  confirmBooking(@Body() body: { seatIds: string[] }, @Req() req: any) {
    return this.theaterService.confirmBooking(body.seatIds, req.user.id);
  }
}
