import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);
  private readonly patientServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.patientServiceUrl = this.configService.get<string>('PATIENT_SERVICE_URL', 'http://patient_service:3002');
  }

  async create(data: any, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.patientServiceUrl}/patients`, data, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('create', error);
    }
  }

  async findAll(query: any, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.patientServiceUrl}/patients`, {
          params: query,
          headers: {
            'Authorization': authHeader,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('findAll', error);
    }
  }

  async findOne(id: string, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.patientServiceUrl}/patients/${id}`, {
          headers: {
            'Authorization': authHeader,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('findOne', error);
    }
  }

  async update(id: string, data: any, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.patientServiceUrl}/patients/${id}`, data, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('update', error);
    }
  }

  async remove(id: string, authHeader: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.patientServiceUrl}/patients/${id}`, {
          headers: {
            'Authorization': authHeader,
          },
        })
      );
    } catch (error) {
      this.handleError('remove', error);
    }
  }

  // Appointments endpoints
  async createAppointment(data: any, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.patientServiceUrl}/appointments`, data, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('createAppointment', error);
    }
  }

  async findAllAppointments(query: any, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.patientServiceUrl}/appointments`, {
          params: query,
          headers: {
            'Authorization': authHeader,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('findAllAppointments', error);
    }
  }

  async findOneAppointment(id: string, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.patientServiceUrl}/appointments/${id}`, {
          headers: {
            'Authorization': authHeader,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('findOneAppointment', error);
    }
  }

  async updateAppointment(id: string, data: any, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.patientServiceUrl}/appointments/${id}`, data, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('updateAppointment', error);
    }
  }

  async updateAppointmentStatus(id: string, status: string, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.patientServiceUrl}/appointments/${id}/status`, 
          { status }, 
          {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
          }
        )
      );
      return response.data;
    } catch (error) {
      this.handleError('updateAppointmentStatus', error);
    }
  }

  async cancelAppointment(id: string, authHeader: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.patientServiceUrl}/appointments/${id}`, {
          headers: {
            'Authorization': authHeader,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.handleError('cancelAppointment', error);
    }
  }

  private handleError(operation: string, error: any): void {
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Error in ${operation}: ${axiosError.message}`,
        axiosError.response?.data
      );
      
      // Re-throw the error with the same status code
      throw {
        statusCode: axiosError.response?.status || 500,
        message: axiosError.response?.data?.['message'] || 'Internal server error',
        error: axiosError.response?.data?.['error'] || 'Error',
      };
    }
    
    this.logger.error(`Error in ${operation}:`, error);
    throw error;
  }
}