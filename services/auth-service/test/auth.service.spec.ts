// services/auth-service/test/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../src/users/entities/user.entity';
import { RegisterUserDto } from '../src/auth/dto/register-user.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt functions
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));


describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUserEntity = {
    id: '1',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;


  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('testAccessToken'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterUserDto = { email: 'new@example.com', password: 'password123', firstName: 'New' };
    const { password, ...userData } = registerDto; // eslint-disable-line @typescript-eslint/no-unused-vars
    const expectedUserResult = { ...userData, id: 'some-uuid', email: registerDto.email };


    it('should successfully register a new user', async () => {
      mockUsersService.findOneByEmail.mockResolvedValueOnce(null);
      mockUsersService.create.mockResolvedValueOnce({ ...expectedUserResult, passwordHash: 'hashedPassword' });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedPassword');


      const result = await service.register(registerDto);
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...expectedReturn } = { ...expectedUserResult, passwordHash: 'hashedPassword' };
      expect(result).toEqual(expectedReturn);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findOneByEmail.mockResolvedValueOnce(mockUserEntity);
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      mockUsersService.findOneByEmail.mockResolvedValueOnce(mockUserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...expectedUser } = mockUserEntity;
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValueOnce(null);
      const result = await service.validateUser('wrong@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      mockUsersService.findOneByEmail.mockResolvedValueOnce(mockUserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const result = await service.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password' };
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userPayload } = mockUserEntity;


    it('should return access token and user if login is successful', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValueOnce(userPayload); // important: mock validateUser of the same instance
      const result = await service.login(loginDto);
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(jwtService.sign).toHaveBeenCalledWith({ email: userPayload.email, sub: userPayload.id });
      expect(result).toEqual({ accessToken: 'testAccessToken', user: userPayload });
    });

    it('should throw UnauthorizedException if login fails', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValueOnce(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});