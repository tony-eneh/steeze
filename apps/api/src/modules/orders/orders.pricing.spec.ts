import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenTailorService } from '../measurements/open-tailor.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Covers the money math on order creation: what the customer is charged and
 * what the platform keeps.
 */
describe('OrdersService - price calculation', () => {
  let service: OrdersService;
  let createdOrderData: any;

  const design = {
    id: 'design-1',
    designerId: 'designer-1',
    basePrice: 45000,
    currency: 'NGN',
    isPublished: true,
    isActive: true,
    estimatedDays: 7,
    designer: { id: 'designer-1' },
    fabricOptions: [
      { id: 'fabric-1', priceAdjustment: 5000, isAvailable: true },
      { id: 'fabric-unavailable', priceAdjustment: 1000, isAvailable: false },
    ],
    addOns: [
      { id: 'addon-1', price: 3000, isAvailable: true },
      { id: 'addon-2', price: 1500, isAvailable: true },
      { id: 'addon-off', price: 900, isAvailable: false },
    ],
    sizePricings: [{ sizeLabel: 'XL', priceAdjustment: 2000 }],
  };

  const prismaMock: any = {
    design: { findUnique: jest.fn() },
    address: { findFirst: jest.fn() },
    platformSetting: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    order: { count: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    createdOrderData = undefined;

    prismaMock.design.findUnique.mockResolvedValue(design);
    prismaMock.address.findFirst.mockResolvedValue({ id: 'address-1' });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'customer-1',
      openTailorEmail: null,
    });
    prismaMock.order.count.mockResolvedValue(0);
    // create() re-reads the order through findOne before returning it.
    prismaMock.order.findUnique.mockImplementation(async () => ({
      id: 'order-1',
      ...createdOrderData,
    }));
    prismaMock.platformSetting.findUnique.mockResolvedValue({
      key: 'commission_percentage',
      value: '10',
    });

    // Capture what the service would persist without needing a database.
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          create: jest.fn(async ({ data }: any) => {
            createdOrderData = data;
            return { id: 'order-1', ...data };
          }),
          findUnique: jest.fn(async () => ({ id: 'order-1' })),
          update: jest.fn(async () => ({ id: 'order-1' })),
        },
        orderAddOnSelection: { createMany: jest.fn() },
        orderFabricSelection: { create: jest.fn() },
        orderStatusHistory: { create: jest.fn() },
      };
      return callback(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: OpenTailorService,
          useValue: { getMeasurementsByEmail: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { notifyOrderUpdate: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  const baseDto = {
    designId: 'design-1',
    deliveryAddressId: 'address-1',
  } as any;

  it('charges the base price when nothing is customised', async () => {
    await service.create('customer-1', { ...baseDto });

    expect(Number(createdOrderData.totalPrice)).toBe(45000);
  });

  it('adds fabric, size, add-ons and delivery into the total', async () => {
    await service.create('customer-1', {
      ...baseDto,
      fabricOptionId: 'fabric-1',
      sizeLabel: 'XL',
      addOnIds: [{ addOnId: 'addon-1' }, { addOnId: 'addon-2' }],
      deliveryFee: 2500,
    });

    // 45000 base + 5000 fabric + 2000 size + 4500 add-ons + 2500 delivery
    expect(Number(createdOrderData.totalPrice)).toBe(59000);
    expect(Number(createdOrderData.fabricPriceAdjustment)).toBe(5000);
    expect(Number(createdOrderData.sizePriceAdjustment)).toBe(2000);
    expect(Number(createdOrderData.addOnsTotal)).toBe(4500);
    expect(Number(createdOrderData.deliveryFee)).toBe(2500);
  });

  it('takes commission at the configured percentage of the total', async () => {
    await service.create('customer-1', { ...baseDto, deliveryFee: 5000 });

    expect(Number(createdOrderData.totalPrice)).toBe(50000);
    expect(Number(createdOrderData.platformCommission)).toBe(5000);
  });

  it('honours a commission percentage changed by an admin', async () => {
    prismaMock.platformSetting.findUnique.mockResolvedValue({
      key: 'commission_percentage',
      value: '15',
    });

    await service.create('customer-1', { ...baseDto });

    expect(Number(createdOrderData.platformCommission)).toBe(6750);
  });

  it('falls back to 10% when the setting is missing', async () => {
    prismaMock.platformSetting.findUnique.mockResolvedValue(null);

    await service.create('customer-1', { ...baseDto });

    expect(Number(createdOrderData.platformCommission)).toBe(4500);
  });

  it('ignores an unknown size rather than guessing a price', async () => {
    await service.create('customer-1', { ...baseDto, sizeLabel: 'XXXL' });

    expect(Number(createdOrderData.sizePriceAdjustment)).toBe(0);
    expect(Number(createdOrderData.totalPrice)).toBe(45000);
  });

  it('rejects a fabric option the designer has turned off', async () => {
    await expect(
      service.create('customer-1', {
        ...baseDto,
        fabricOptionId: 'fabric-unavailable',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an add-on the designer has turned off', async () => {
    await expect(
      service.create('customer-1', {
        ...baseDto,
        addOnIds: [{ addOnId: 'addon-off' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an address belonging to someone else', async () => {
    prismaMock.address.findFirst.mockResolvedValue(null);

    await expect(service.create('customer-1', { ...baseDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects an unpublished design', async () => {
    prismaMock.design.findUnique.mockResolvedValue({
      ...design,
      isPublished: false,
    });

    await expect(service.create('customer-1', { ...baseDto })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('opens the order awaiting payment', async () => {
    await service.create('customer-1', { ...baseDto });

    expect(createdOrderData.status).toBe('PENDING_PAYMENT');
  });
});
