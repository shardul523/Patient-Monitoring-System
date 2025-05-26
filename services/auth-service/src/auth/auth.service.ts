// services/auth-service/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, firstName, lastName } = registerUserDto;

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const saltRounds = 10;
    let passwordHash: string;
    try {
        passwordHash = await bcrypt.hash(password, saltRounds);
    } catch (error) {
        this.logger.error(`Failed to hash password for user ${email}`, error.stack);
        throw new InternalServerErrorException('Error processing registration.');
    }


    try {
      const user = await this.usersService.create({ email, passwordHash, firstName, lastName });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...result } = user;
      return result;
    } catch (error) {
        this.logger.error(`Failed to create user ${email}`, error.stack);
        if (error.code === '23505') { // Unique constraint violation for email
             throw new ConflictException('Email already exists.');
        }
        throw new InternalServerErrorException('Could not register user.');
    }
  }

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string; user: Omit<User, 'passwordHash'> }> {
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { email: user.email, sub: user.id }; // `sub` is standard for user ID in JWT
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }
}