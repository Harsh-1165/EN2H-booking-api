import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Full Haircut & Style', description: 'The title of the service' })
  @IsString()
  @IsNotEmpty({ message: 'Service title is required' })
  title: string;

  @ApiProperty({
    example: 'Includes wash, cut, blow dry and styling with premium gel.',
    description: 'Detailed service description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ example: 45, description: 'Duration of the service in minutes' })
  @IsInt()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration: number;

  @ApiProperty({ example: 49.99, description: 'Price of the service' })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiProperty({ example: true, description: 'Whether the service is active and bookable', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
