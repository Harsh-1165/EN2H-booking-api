import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '../enums/booking-status.enum';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
    description: 'The new status of the booking',
  })
  @IsEnum(BookingStatus, {
    message: 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  status: BookingStatus;
}
