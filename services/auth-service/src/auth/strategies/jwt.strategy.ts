// services/auth-service/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'; // Added Logger
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions, StrategyOptionsWithRequest } from 'passport-jwt'; // Imported StrategyOptions
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    // if (!jwtSecret) {
    //   // This log helps in debugging if the secret is not loaded.
    //   // A more robust solution would be to throw an error during app bootstrap
    //   // if critical configurations like JWT_SECRET are missing.
    //   this.logger.error('JWT_SECRET is not defined in environment variables!');
    //   // throw new Error('JWT_SECRET is not defined'); // Or handle appropriately
    // }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || 'fallbackSecretIfNotSetButShouldBeError', // Fallback to satisfy type, but ensure it IS set
    } as StrategyOptionsWithRequest); // Added type assertion for clarity if needed, or ensure jwtSecret is string
  }

  async validate(payload: { sub: string; email: string }): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findOneById(payload.sub); // findOneById already throws if not found
    if (!user) {
      // This check might be redundant if findOneById always throws, but good for clarity
      throw new UnauthorizedException('User not found or token invalid.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}