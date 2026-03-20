import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import DTOInterface from 'src/interfaces/dto.interface';

export class CreateUserDto extends DTOInterface {
  @ApiProperty({ example: 'Nome de exemplo' })
  @IsString()
  nome?: string;
  @ApiProperty({ example: 'Sobrenome de exemplo' })
  @IsString()
  sobrenome?: string;
  @ApiProperty({ example: 'email@example.com' })
  @IsEmail()
  email!: string;
  @ApiProperty({ example: 'Tskyfly1403*' })
  @IsStrongPassword()
  @MinLength(6)
  password!: string;
  @ApiProperty({ example: 'superuser' })
  @IsString()
  accessLevel!: string;
}
