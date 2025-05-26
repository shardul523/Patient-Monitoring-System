// services/auth-service/src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from '../auth/dto/register-user.dto'; // We'll create this DTO soon

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOneById(id: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async create(createUserDto: Omit<RegisterUserDto, 'password'> & { passwordHash: string }): Promise<User> {
    const newUser = this.usersRepository.create({
        email: createUserDto.email,
        passwordHash: createUserDto.passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
    });
    return this.usersRepository.save(newUser);
  }
}