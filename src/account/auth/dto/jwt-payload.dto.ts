import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsString } from 'class-validator';

export class JwtPayloadDto {
  @ApiProperty({ example: 1 })
  sub: number;

  @ApiProperty({ example: 'email@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  sobrenome: string;

  @ApiProperty({ example: 'user' })
  role: string;
}
