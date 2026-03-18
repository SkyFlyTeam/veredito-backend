import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class JwtPayloadDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  sub: string;

  @ApiProperty({ example: 'email@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'user' })
  role: string;
}
