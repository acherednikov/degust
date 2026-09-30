import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  targetSocketId: string;

  @IsString()
  @IsNotEmpty()
  sdp: string;
}
