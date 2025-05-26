// services/api-gateway/src/auth/auth.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig }    from 'axios';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || '';
    if (!this.authServiceUrl) {
        this.logger.error('AUTH_SERVICE_URL is not configured!');
        throw new Error('AUTH_SERVICE_URL is not configured!');
    }
  }

  private async forwardRequest(
      method: string,
      endpoint: string,
      data?: any,
      headers?: Record<string, string>,
    ): Promise<any> {
    const url = `${this.authServiceUrl}/${endpoint}`;
    this.logger.log(`Forwarding ${method} request to: ${url}`);

    const requestConfig: AxiosRequestConfig = {
        method: method as any, // 'get', 'post', etc.
        url: url,
        data: data,
        headers: { ...headers }, // Spread to include any passed headers
    };

    try {
      const response = await firstValueFrom(this.httpService.request(requestConfig));
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error forwarding request to ${url}: ${axiosError.message}`, axiosError.stack);
      if (axiosError.response) {
        throw new HttpException(axiosError.response.data || "Internal ERror", axiosError.response.status);
      } else {
        throw new HttpException('Error connecting to auth service', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async register(registerDto: any): Promise<any> {
    return this.forwardRequest('post', 'auth/register', registerDto);
  }

  async login(loginDto: any): Promise<any> {
    return this.forwardRequest('post', 'auth/login', loginDto);
  }

  async getProfile(token: string): Promise<any> {
    const headers = {
      'Authorization': token, // Pass the original Bearer token
    };
    return this.forwardRequest('get', 'auth/profile', undefined, headers);
  }
}