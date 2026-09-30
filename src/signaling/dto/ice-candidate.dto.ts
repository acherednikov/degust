import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class IceCandidateDto {
  @IsString()
  @IsNotEmpty()
  targetSocketId: string;

  /**
   * Сериализованный RTCIceCandidate: JSON.stringify(event.candidate).
   * Сервер содержимое не парсит, только пересылает.
   */
  @IsString()
  @IsNotEmpty()
  candidate: string;

  @IsString()
  @IsOptional()
  sdpMid?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sdpMLineIndex?: number;
}
