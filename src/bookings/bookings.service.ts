import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ServicesService } from '../services/services.service';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly servicesService: ServicesService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { serviceId, bookingDate, bookingTime } = createBookingDto;

    // 1. Verify service exists and is active
    const service = await this.servicesService.findOne(serviceId);
    if (!service.isActive) {
      throw new BadRequestException('Selected service is not active/available');
    }

    // 2. Verify booking date and time are in the future
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [hour, minute] = bookingTime.split(':').map(Number);
    const bookingDateTime = new Date(year, month - 1, day, hour, minute);
    const currentDateTime = new Date();

    if (bookingDateTime <= currentDateTime) {
      throw new BadRequestException('Booking date and time must be in the future');
    }

    // 3. Prevent duplicate bookings for the same service, date, and time
    // We ignore CANCELLED bookings as they release the slot
    const duplicate = await this.bookingRepository.findOne({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: Not(In([BookingStatus.CANCELLED])),
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'This time slot is already booked for the selected service',
      );
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: BookingStatus,
    search?: string,
  ) {
    const queryBuilder = this.bookingRepository.createQueryBuilder('booking');
    queryBuilder.leftJoinAndSelect('booking.service', 'service');

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(booking.customerName LIKE :search OR booking.customerEmail LIKE :search OR booking.customerPhone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('booking.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: { service: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    // Business rule: Cancelled bookings cannot be marked as completed
    if (booking.status === BookingStatus.CANCELLED && status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cancelled bookings cannot be marked as completed');
    }

    booking.status = status;
    return this.bookingRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    // Additional safeguard: completed bookings shouldn't be cancelled
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}
