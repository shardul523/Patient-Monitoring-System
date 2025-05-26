// services/auth-service/test/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { RegisterUserDto } from '../src/auth/dto/register-user.dto';
import { LoginUserDto } from '../src/auth/dto/login-user.dto';
import { User } from '../src/users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';


describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser: Omit<User, 'passwordHash' | 'createdAt' | 'updatedAt'> = {
    id: 'some-uuid',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockAuthService = {
    register: jest.fn().mockResolvedValue(mockUser),
    login: jest.fn().mockResolvedValue({ accessToken: 'some-jwt-token', user: mockUser }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true, load: [() => ({ JWT_SECRET: 'testsecret', JWT_EXPIRATION_TIME: '60s' })] }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
          }),
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
    .overrideGuard(AuthGuard('jwt')) // Mock the guard for testing protected routes if needed
    .useValue({ canActivate: () => true }) // or provide a mock implementation
    .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return user data', async () => {
      const registerDto: RegisterUserDto = { email: 'test@example.com', password: 'password123', firstName: 'Test' };
      const result = await controller.register(registerDto);
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({ message: 'User registered successfully', user: mockUser });
    });
  });

  describe('login', () => {
    it('should login a user and return an access token and user data', async () => {
      const loginDto: LoginUserDto = { email: 'test@example.com', password: 'password123' };
      const result = await controller.login(loginDto);
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({ accessToken: 'some-jwt-token', user: mockUser });
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', () => {
      const req = { user: mockUser }; // Mock the request object with user populated by AuthGuard
      const result = controller.getProfile(req);
      expect(result).toEqual({ message: 'Authenticated user profile data', user: mockUser });
    });
  });
});