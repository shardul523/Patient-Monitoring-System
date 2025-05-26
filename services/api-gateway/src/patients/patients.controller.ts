import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Request } from 'express';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any, @Req() req: Request) {
    return this.patientsService.create(body, req.headers['authorization'] || '');
  }

  @Get()
  findAll(@Query() query: any, @Req() req: Request) {
    return this.patientsService.findAll(query, req.headers['authorization'] || '');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.patientsService.findOne(id, req.headers['authorization'] || '');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.patientsService.update(id, body, req.headers['authorization'] || '');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.patientsService.remove(id, req.headers['authorization'] || '');
  }
}

// Create a separate controller for appointments
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any, @Req() req: Request) {
    return this.patientsService.createAppointment(body, req.headers['authorization'] || '');
  }

  @Get()
  findAll(@Query() query: any, @Req() req: Request) {
    return this.patientsService.findAllAppointments(query, req.headers['authorization'] || '');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.patientsService.findOneAppointment(id, req.headers['authorization'] || '');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.patientsService.updateAppointment(id, body, req.headers['authorization'] || '');
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    return this.patientsService.updateAppointmentStatus(id, status, req.headers['authorization'] || '');
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Req() req: Request) {
    return this.patientsService.cancelAppointment(id, req.headers['authorization'] || '');
  }
}