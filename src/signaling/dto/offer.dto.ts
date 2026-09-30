import { IsNotEmpty, IsString } from 'class-validator';

export class OfferDto {
  @IsString()
  @IsNotEmpty()
  targetSocketId: string;

  @IsString()
  @IsNotEmpty()
  sdp: string;
}
