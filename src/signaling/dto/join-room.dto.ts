import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  roomId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  displayName: string;
}
