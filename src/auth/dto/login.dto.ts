import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import DTOInterface from 'src/interfaces/dto.interface';

export class LoginDto extends DTOInterface {
  @ApiProperty({ example: 'email@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
