import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { NotFoundException } from '@nestjs/common';

const mockService = {
  id: 'service-id-uuid',
  title: 'Haircut',
  description: 'Nice styling',
  duration: 30,
  price: 25.0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ServicesService', () => {
  let service: ServicesService;
  let repo: Repository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockResolvedValue(mockService),
            findAndCount: jest.fn().mockResolvedValue([[mockService], 1]),
            findOne: jest.fn().mockResolvedValue(mockService),
            remove: jest.fn().mockResolvedValue(mockService),
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repo = module.get<Repository<Service>>(getRepositoryToken(Service));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a service', async () => {
      const dto = {
        title: 'Haircut',
        description: 'Nice styling',
        duration: 30,
        price: 25.0,
      };
      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockService);
    });
  });

  describe('findOne', () => {
    it('should return service if found', async () => {
      const result = await service.findOne('service-id-uuid');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'service-id-uuid' } });
      expect(result).toEqual(mockService);
    });

    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(service.findOne('wrong-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of services', async () => {
      const result = await service.findAll(1, 10, true);
      expect(repo.findAndCount).toHaveBeenCalled();
      expect(result.data).toEqual([mockService]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update and return the service', async () => {
      const dto = { title: 'New Haircut' };
      const updatedMock = { ...mockService, ...dto };
      jest.spyOn(repo, 'save').mockResolvedValue(updatedMock as any);
      
      const result = await service.update('service-id-uuid', dto);
      expect(result.title).toBe('New Haircut');
    });
  });

  describe('remove', () => {
    it('should remove the service successfully', async () => {
      await service.remove('service-id-uuid');
      expect(repo.remove).toHaveBeenCalled();
    });
  });
});
