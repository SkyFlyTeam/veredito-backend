import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import DTOInterface from 'src/interfaces/dto.interface';

export class LoginDto extends DTOInterface {
  @ApiProperty({ example: 'skyfy.team@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Skyfly1403*' })
  @IsString()
  password: string;
}
