import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { OpenTailorService } from '../measurements/open-tailor.service';
import { NotificationsService } from '../notifications/notifications.service';

const ORDER_STATUS = {
  DELIVERED: 'DELIVERED',
  CONFIRMED: 'CONFIRMED',
} as const;

const PAYMENT_STATUS = {
  HELD_IN_ESCROW: 'HELD_IN_ESCROW',
} as const;

describe('OrdersService - confirmOrder', () => {
  let service: OrdersService;

  const prismaMock = {
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const notificationsMock = {
    notifyOrderUpdate: jest.fn(),
    notifyPaymentUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: OpenTailorService,
          useValue: { getMeasurementsByEmail: jest.fn() },
        },
        { provide: NotificationsService, useValue: notificationsMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('sends order + payment notifications when customer confirms delivered order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      status: ORDER_STATUS.DELIVERED,
    });

    prismaMock.$transaction.mockImplementation(
      (callback: (tx: any) => Promise<unknown>) => {
        const tx = {
          order: {
            update: jest.fn().mockResolvedValue({
              id: 'order-1',
              orderNumber: 'STZ-20260225-ABCD',
              totalPrice: 15000,
              platformCommission: 1500,
              currency: 'NGN',
              customer: { id: 'customer-1' },
              designer: { userId: 'designer-user-1' },
              payment: {
                id: 'payment-1',
                status: PAYMENT_STATUS.HELD_IN_ESCROW,
              },
            }),
          },
          orderStatusHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
          payment: {
            update: jest.fn().mockResolvedValue({}),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        return callback(tx);
      },
    );

    await service.confirmOrder('customer-1', 'order-1', { note: 'Looks good' });

    expect(notificationsMock.notifyOrderUpdate).toHaveBeenCalledTimes(2);
    expect(notificationsMock.notifyOrderUpdate).toHaveBeenNthCalledWith(
      1,
      'customer-1',
      'order-1',
      'STZ-20260225-ABCD',
      ORDER_STATUS.CONFIRMED,
    );
    expect(notificationsMock.notifyOrderUpdate).toHaveBeenNthCalledWith(
      2,
      'designer-user-1',
      'order-1',
      'STZ-20260225-ABCD',
      ORDER_STATUS.CONFIRMED,
    );

    expect(notificationsMock.notifyPaymentUpdate).toHaveBeenCalledWith(
      'designer-user-1',
      'order-1',
      'STZ-20260225-ABCD',
      'released',
      13500,
    );
  });

  it('does not send payment release notification when there is no escrow release', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-2',
      customerId: 'customer-1',
      status: ORDER_STATUS.DELIVERED,
    });

    prismaMock.$transaction.mockImplementation(
      (callback: (tx: any) => Promise<unknown>) => {
        const tx = {
          order: {
            update: jest.fn().mockResolvedValue({
              id: 'order-2',
              orderNumber: 'STZ-20260225-EFGH',
              totalPrice: 12000,
              platformCommission: 1200,
              currency: 'NGN',
              customer: { id: 'customer-1' },
              designer: { userId: 'designer-user-1' },
              payment: null,
            }),
          },
          orderStatusHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
          payment: {
            update: jest.fn().mockResolvedValue({}),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        return callback(tx);
      },
    );

    await service.confirmOrder('customer-1', 'order-2', {});

    expect(notificationsMock.notifyOrderUpdate).toHaveBeenCalledTimes(2);
    expect(notificationsMock.notifyPaymentUpdate).not.toHaveBeenCalled();
  });
});
