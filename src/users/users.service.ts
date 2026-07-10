import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const existing = await this.findByEmail(userData.email || '');
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt();
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = this.userRepository.create(userData);
    const saved = await this.userRepository.save(user);
    delete saved.password; // Do not return password
    return saved;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string): Promise<void> {
    const salt = await bcrypt.genSalt();
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.userRepository.update(userId, { currentHashedRefreshToken });
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      currentHashedRefreshToken: null as any,
    });
  }
}
