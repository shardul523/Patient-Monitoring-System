// services/auth-service/src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport'; // Using the generic AuthGuard

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDto: RegisterUserDto) {
    this.logger.log(`Attempting to register user: ${registerUserDto.email}`);
    const user = await this.authService.register(registerUserDto);
    this.logger.log(`User registered successfully: ${user.email}`);
    // Avoid sending password hash back
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ...result } = user;
    return { message: 'User registered successfully', user: result };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    this.logger.log(`Attempting to login user: ${loginUserDto.email}`);
    const result = await this.authService.login(loginUserDto);
    this.logger.log(`User logged in successfully: ${result.user.email}`);
    return result;
  }

  // Example of a protected route
  @UseGuards(AuthGuard('jwt')) // Protect this route with JWT strategy
  @Get('profile')
  getProfile(@Req() req) {
    // req.user is populated by Passport's JWT strategy (the result of jwt.strategy.ts validate function)
    this.logger.log(`Profile requested by user: ${req.user.email}`);
    return { message: 'Authenticated user profile data', user: req.user };
  }
}