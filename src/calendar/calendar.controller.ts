import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Delete } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('slots')
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new time slot (Providers only)' })
  createSlot(@Body() body: { startTime: string; endTime: string }, @Req() req: any) {
    return this.calendarService.createSlot(
      req.user.id,
      new Date(body.startTime),
      new Date(body.endTime),
    );
  }

  @Get('slots')
  @ApiOperation({ summary: 'Find all slots with filters' })
  findAll(@Query() query: any) {
    return this.calendarService.findAll(query);
  }

  @Post('slots/:id/book')
  @ApiOperation({ summary: 'Book a time slot' })
  bookSlot(@Param('id') id: string, @Req() req: any) {
    return this.calendarService.bookSlot(id, req.user.id);
  }

  @Delete('slots/:id')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancelBooking(@Param('id') id: string, @Req() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.calendarService.cancelBooking(id, req.user.id, isAdmin);
  }
}
