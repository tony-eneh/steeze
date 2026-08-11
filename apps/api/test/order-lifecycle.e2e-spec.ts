import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, uniqueEmail } from './test-app';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Walks a single order through the whole lifecycle against a real database:
 * register both sides, publish a design, order it, pay, deliver, confirm and
 * rate. Then repeats the delivery stage on a second order to exercise the
 * return path.
 */
describe('Order lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let customerToken: string;
  let customerId: string;
  let designerToken: string;
  let designerId: string;
  let adminToken: string;
  let adminId: string;
  let designId: string;
  let addressId: string;

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    await prisma.platformSetting.upsert({
      where: { key: 'commission_percentage' },
      update: { value: '10' },
      create: { key: 'commission_percentage', value: '10' },
    });
    await prisma.platformSetting.upsert({
      where: { key: 'return_courier_fee' },
      update: { value: '2500' },
      create: { key: 'return_courier_fee', value: '2500' },
    });

    const customer = await api()
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail('customer'),
        password: 'Password123!',
        firstName: 'Ada',
        lastName: 'Customer',
        role: 'CUSTOMER',
      })
      .expect(201);

    customerToken = customer.body.data.accessToken;
    customerId = customer.body.data.user.id;

    const designer = await api()
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail('designer'),
        password: 'Password123!',
        firstName: 'Bola',
        lastName: 'Designer',
        role: 'DESIGNER',
        businessName: `Atelier ${Math.random().toString(36).slice(2, 8)}`,
        shopAddress: '1 Workshop Road',
        shopCity: 'Lagos',
        shopState: 'Lagos',
      })
      .expect(201);

    designerToken = designer.body.data.accessToken;
    designerId = designer.body.data.user.id;

    // Courier movements and return handling are admin-only, so the lifecycle
    // needs a third actor to play the Steeze operator.
    const adminEmail = uniqueEmail('admin');
    const admin = await api()
      .post('/api/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'Password123!',
        firstName: 'Ops',
        lastName: 'Admin',
        role: 'CUSTOMER',
      })
      .expect(201);

    adminId = admin.body.data.user.id;
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    const adminLogin = await api()
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'Password123!' })
      .expect(201);

    adminToken = adminLogin.body.data.accessToken;

    const address = await api()
      .post('/api/v1/users/me/addresses')
      .set(auth(customerToken))
      .send({
        label: 'Home',
        street: '12 Marina Street',
        city: 'Lagos',
        state: 'Lagos',
        isDefault: true,
      })
      .expect(201);

    addressId = address.body.data?.id ?? address.body.data;

    const design = await api()
      .post('/api/v1/designs')
      .set(auth(designerToken))
      .send({
        title: 'Lifecycle Agbada',
        description: 'A design used by the lifecycle test',
        basePrice: 45000,
        category: 'agbada',
        isPublished: true,
      })
      .expect(201);

    designId = design.body.data.id;
  });

  afterAll(async () => {
    // Users cascade to designs, orders, payments, ratings and returns.
    const userIds = [customerId, designerId, adminId].filter(Boolean);

    // Orders hold restrict-style references to users, so they go first.
    const orders = await prisma.order.findMany({
      where: { customerId: { in: userIds } },
      select: { id: true },
    });
    const orderIds = orders.map((order) => order.id);

    await prisma.walletTransaction.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.rating.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.returnRequest.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  /** Creates a paid order and moves it as far as delivery. */
  async function deliveredOrder(): Promise<string> {
    const created = await api()
      .post('/api/v1/orders')
      .set(auth(customerToken))
      .send({ designId, deliveryAddressId: addressId, deliveryFee: 2500 })
      .expect(201);

    const orderId = created.body.data.id;

    // Payment itself goes through Paystack, so the escrow state is set
    // directly here rather than calling out to a third party in a test.
    await prisma.payment.create({
      data: {
        orderId,
        externalRef: `test-${orderId}`,
        amount: created.body.data.totalPrice,
        currency: 'NGN',
        status: 'HELD_IN_ESCROW',
        paidAt: new Date(),
      },
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await api()
      .patch(`/api/v1/orders/${orderId}/accept`)
      .set(auth(designerToken))
      .send({})
      .expect(200);
    await api()
      .patch(`/api/v1/orders/${orderId}/in-progress`)
      .set(auth(designerToken))
      .send({})
      .expect(200);
    await api()
      .patch(`/api/v1/orders/${orderId}/ready`)
      .set(auth(designerToken))
      .send({})
      .expect(200);
    await api()
      .patch(`/api/v1/orders/${orderId}/picked-up`)
      .set(auth(adminToken))
      .send({})
      .expect(200);
    await api()
      .patch(`/api/v1/orders/${orderId}/in-transit`)
      .set(auth(adminToken))
      .send({})
      .expect(200);
    await api()
      .patch(`/api/v1/orders/${orderId}/delivered`)
      .set(auth(adminToken))
      .send({})
      .expect(200);

    return orderId;
  }

  describe('happy path', () => {
    let orderId: string;

    it('prices the order from the design and delivery fee', async () => {
      const created = await api()
        .post('/api/v1/orders')
        .set(auth(customerToken))
        .send({ designId, deliveryAddressId: addressId, deliveryFee: 2500 })
        .expect(201);

      expect(Number(created.body.data.totalPrice)).toBe(47500);
      expect(Number(created.body.data.platformCommission)).toBe(4750);
      expect(created.body.data.status).toBe('PENDING_PAYMENT');

      await prisma.order.delete({ where: { id: created.body.data.id } });
    });

    it('reaches delivered through the designer transitions', async () => {
      orderId = await deliveredOrder();

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order?.status).toBe('DELIVERED');
      expect(order?.deliveredAt).toBeInstanceOf(Date);
    });

    it('will not let a stranger confirm the order', async () => {
      await api()
        .patch(`/api/v1/orders/${orderId}/confirm`)
        .set(auth(designerToken))
        .send({})
        .expect(403);
    });

    it('releases escrow to the designer on confirmation', async () => {
      await api()
        .patch(`/api/v1/orders/${orderId}/confirm`)
        .set(auth(customerToken))
        .send({})
        .expect(200);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });

      expect(order?.status).toBe('CONFIRMED');
      expect(order?.payment?.status).toBe('RELEASED');

      // Wallet transactions reference the payment rather than the order.
      const designerCredit = await prisma.walletTransaction.findFirst({
        where: {
          userId: designerId,
          type: 'ESCROW_RELEASE',
          payment: { orderId },
        },
      });

      // 47500 total less 4750 commission.
      expect(Number(designerCredit?.amount)).toBe(42750);
    });

    it('unlocks ratings in both directions once confirmed', async () => {
      await api()
        .post(`/api/v1/ratings/orders/${orderId}/rate`)
        .set(auth(customerToken))
        .send({ score: 5, comment: 'Beautiful work' })
        .expect(201);

      await api()
        .post(`/api/v1/ratings/orders/${orderId}/rate`)
        .set(auth(designerToken))
        .send({ score: 4, comment: 'Clear brief' })
        .expect(201);

      const ratings = await prisma.rating.findMany({ where: { orderId } });
      expect(ratings).toHaveLength(2);
    });

    it('rejects a second rating from the same party', async () => {
      await api()
        .post(`/api/v1/ratings/orders/${orderId}/rate`)
        .set(auth(customerToken))
        .send({ score: 1 })
        .expect(400);
    });
  });

  describe('return path', () => {
    let orderId: string;
    let returnId: string;

    it('accepts a return request within the window', async () => {
      orderId = await deliveredOrder();

      const created = await api()
        .post(`/api/v1/returns/orders/${orderId}/return`)
        .set(auth(customerToken))
        .send({ reason: 'The sleeves are the wrong length' })
        .expect(201);

      returnId = created.body.data?.id ?? created.body.id;
      expect(returnId).toBeDefined();

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order?.status).toBe('RETURN_REQUESTED');
    });

    it('refuses a second return request on the same order', async () => {
      await api()
        .post(`/api/v1/returns/orders/${orderId}/return`)
        .set(auth(customerToken))
        .send({ reason: 'Trying again' })
        .expect(400);
    });

    it('moves the return through pickup to returned', async () => {
      await api()
        .patch(`/api/v1/returns/${returnId}/approve`)
        .set(auth(adminToken))
        .send({})
        .expect(200);

      await api()
        .patch(`/api/v1/returns/${returnId}/pickup-dispatched`)
        .set(auth(adminToken))
        .send({})
        .expect(200);

      await api()
        .patch(`/api/v1/returns/${returnId}/returned`)
        .set(auth(adminToken))
        .send({})
        .expect(200);

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order?.status).toBe('RETURNED');
    });

    it('does not release escrow to the designer on a return', async () => {
      const release = await prisma.walletTransaction.findFirst({
        where: {
          userId: designerId,
          type: 'ESCROW_RELEASE',
          payment: { orderId },
        },
      });

      expect(release).toBeNull();
    });
  });
});
