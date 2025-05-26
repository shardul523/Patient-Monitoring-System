// services/api-gateway/src/auth/auth.controller.ts
import { Controller, Post, Body, Get, Req, Logger, HttpCode, HttpStatus, All, Param } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth') // This will be prefixed by /api/v1 from main.ts
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: any) {
    this.logger.log('API Gateway: Received registration request');
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    this.logger.log('API Gateway: Received login request');
    return this.authService.login(body);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: Request) {
    this.logger.log('API Gateway: Received profile request');
    const authorizationHeader = req.headers['authorization']; // Get 'Bearer TOKEN'
    if (!authorizationHeader) {
        return { statusCode: HttpStatus.UNAUTHORIZED, message: 'Missing authorization header' };
    }
    return this.authService.getProfile(authorizationHeader);
  }

  // Optional: A more generic proxy if you have many simple GET/POST routes
  // Ensure to secure this properly if you use a generic proxy.
  // @All(':microservice/:path(*)')
  // async proxyAll(
  //   @Param('microservice') microservice: string,
  //   @Param('path') path: string,
  //   @Req() req: Request,
  //   @Body() body: any,
  // ) {
  //   if (microservice === 'auth') {
  //       this.logger.log(`Proxying ${req.method} to auth/${path}`);
  //       const authHeader = req.headers['authorization'];
  //       return this.authService.proxyRequest(
  //           req.method,
  //           `auth/${path}`, // Construct the endpoint for auth service
  //           body,
  //           authHeader ? { 'Authorization': authHeader } : {}
  //       );
  //   }
  //   // Handle other microservices or return 404
  //   return { statusCode: 404, message: 'Microservice not found or path not proxied' };
  // }
}