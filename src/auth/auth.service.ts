import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.setCurrentRefreshToken(tokens.refreshToken, user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.setCurrentRefreshToken(tokens.refreshToken, user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.currentHashedRefreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );
    if (!isRefreshTokenMatching) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.setCurrentRefreshToken(tokens.refreshToken, user.id);
    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'super_secret_access_key_change_me_in_production',
        expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '1h') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'super_secret_refresh_key_change_me_in_production',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
