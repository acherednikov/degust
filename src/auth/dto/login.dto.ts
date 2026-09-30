import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  displayName: string;
}
