import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { ServicesService } from '../services/services.service';
import { BookingStatus } from './enums/booking-status.enum';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

const mockService = {
  id: 'service-id-uuid',
  title: 'Consulting',
  description: 'Pro service',
  duration: 60,
  price: 150.00,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBooking = {
  id: 'booking-id-uuid',
  customerName: 'Alice Smith',
  customerEmail: 'alice@example.com',
  customerPhone: '+1234567890',
  serviceId: 'service-id-uuid',
  bookingDate: '2030-10-10',
  bookingTime: '14:00',
  status: BookingStatus.PENDING,
  notes: 'First booking',
  service: mockService,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepository: Repository<Booking>;
  let servicesService: ServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockResolvedValue(mockBooking),
            findOne: jest.fn().mockResolvedValue(mockBooking),
            findAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
            }),
          },
        },
        {
          provide: ServicesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockService),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    servicesService = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create booking if all business rules pass', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null); // No duplicates

      const dto = {
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service-id-uuid',
        bookingDate: '2030-10-10', // Way in the future
        bookingTime: '14:00',
        notes: 'First booking',
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockBooking);
    });

    it('should throw BadRequestException if service is not active', async () => {
      jest.spyOn(servicesService, 'findOne').mockResolvedValue({
        ...mockService,
        isActive: false,
      } as any);

      const dto = {
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service-id-uuid',
        bookingDate: '2030-10-10',
        bookingTime: '14:00',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking date/time is in the past', async () => {
      const dto = {
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service-id-uuid',
        bookingDate: '2020-01-01', // Way in the past
        bookingTime: '14:00',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if duplicate slot exists', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any); // Duplicate exists

      const dto = {
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service-id-uuid',
        bookingDate: '2030-10-10',
        bookingTime: '14:00',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should update booking status successfully', async () => {
      const savedMock = { ...mockBooking, status: BookingStatus.CONFIRMED };
      jest.spyOn(bookingRepository, 'save').mockResolvedValue(savedMock as any);

      const result = await service.updateStatus('booking-id-uuid', BookingStatus.CONFIRMED);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw BadRequestException if trying to complete a CANCELLED booking', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(cancelledBooking as any);

      await expect(
        service.updateStatus('booking-id-uuid', BookingStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel booking successfully', async () => {
      const cancelledMock = { ...mockBooking, status: BookingStatus.CANCELLED };
      jest.spyOn(bookingRepository, 'save').mockResolvedValue(cancelledMock as any);

      const result = await service.cancel('booking-id-uuid');
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException if trying to cancel a COMPLETED booking', async () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.COMPLETED };
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(completedBooking as any);

      await expect(service.cancel('booking-id-uuid')).rejects.toThrow(BadRequestException);
    });
  });
});
