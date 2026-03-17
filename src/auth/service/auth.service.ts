import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/service/user.service';
import { CreateUserDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.userService.create({
      nome: dto.nome,
      email: dto.email,
      password: hashedPassword,
      accessLevel: dto.accessLevel,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.accessLevel.nome,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
