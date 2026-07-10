import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  IsUUID,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Alice Smith', description: 'Name of the customer' })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName: string;

  @ApiProperty({ example: 'alice.smith@example.com', description: 'Email address of the customer' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  customerEmail: string;

  @ApiProperty({ example: '+14155552671', description: 'Phone number of the customer' })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone number is required' })
  // In a real application, you might want to use a phone number validator like IsPhoneNumber but we'll accept any valid phone string.
  customerPhone: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', description: 'UUID of the service being booked' })
  @IsUUID('4', { message: 'serviceId must be a valid UUID' })
  serviceId: string;

  @ApiProperty({ example: '2026-07-20', description: 'Booking date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Booking date must be in YYYY-MM-DD format' })
  bookingDate: string;

  @ApiProperty({ example: '14:30', description: 'Booking time in HH:MM (24-hour) format' })
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Booking time must be in HH:MM (24-hour) format',
  })
  bookingTime: string;

  @ApiProperty({ example: 'Needs wheelchair access.', description: 'Additional instructions or notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
