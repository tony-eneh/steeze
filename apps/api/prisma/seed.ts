import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@steeze.com' },
    update: {},
    create: {
      email: 'admin@steeze.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // 2. Create platform settings
  const settings = [
    { key: 'commission_percentage', value: '10' },
    { key: 'return_courier_fee', value: '2500' },
    { key: 'auto_confirm_days', value: '2' },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Created platform settings');

  // 3. Create sample designers
  const designer1Hash = await bcrypt.hash('Designer123!', 12);
  const designer1User = await prisma.user.upsert({
    where: { email: 'designer1@steeze.com' },
    update: {},
    create: {
      email: 'designer1@steeze.com',
      passwordHash: designer1Hash,
      firstName: 'Amara',
      lastName: 'Okafor',
      role: 'DESIGNER',
      isEmailVerified: true,
      isActive: true,
    },
  });

  const designer1Profile = await prisma.designerProfile.upsert({
    where: { userId: designer1User.id },
    update: {},
    create: {
      userId: designer1User.id,
      businessName: 'Amara Couture',
      slug: 'amara-couture',
      bio: 'Specializing in traditional Nigerian attire with a modern twist. Over 10 years of experience in bespoke fashion.',
      shopAddress: '15 Allen Avenue, Ikeja',
      shopCity: 'Lagos',
      shopState: 'Lagos',
      shopLatitude: 6.6018,
      shopLongitude: 3.3515,
      isVerified: true,
      averageRating: 4.8,
      totalCompletedOrders: 45,
    },
  });
  console.log('✅ Created designer 1:', designer1Profile.businessName);

  const designer2Hash = await bcrypt.hash('Designer123!', 12);
  const designer2User = await prisma.user.upsert({
    where: { email: 'designer2@steeze.com' },
    update: {},
    create: {
      email: 'designer2@steeze.com',
      passwordHash: designer2Hash,
      firstName: 'Chidi',
      lastName: 'Nnamdi',
      role: 'DESIGNER',
      isEmailVerified: true,
      isActive: true,
    },
  });

  const designer2Profile = await prisma.designerProfile.upsert({
    where: { userId: designer2User.id },
    update: {},
    create: {
      userId: designer2User.id,
      businessName: 'Chidi Styles',
      slug: 'chidi-styles',
      bio: 'Contemporary African fashion for the modern gentleman. Expert in Agbada and Senator styles.',
      shopAddress: '23 Obafemi Awolowo Way, Wuse 2',
      shopCity: 'Abuja',
      shopState: 'FCT',
      shopLatitude: 9.0765,
      shopLongitude: 7.4165,
      isVerified: true,
      averageRating: 4.6,
      totalCompletedOrders: 32,
    },
  });
  console.log('✅ Created designer 2:', designer2Profile.businessName);

  // 4. Create sample designs
  const design1 = await prisma.design.create({
    data: {
      designerId: designer1Profile.id,
      title: 'Classic Agbada Set',
      description: 'Traditional three-piece Agbada set with intricate embroidery. Perfect for weddings and special occasions.',
      basePrice: 45000,
      currency: 'NGN',
      category: 'Agbada',
      gender: 'male',
      estimatedDays: 14,
      isPublished: true,
      isActive: true,
    },
  });
  console.log('✅ Created design 1:', design1.title);

  // Add fabric options for design 1
  await prisma.fabricOption.createMany({
    data: [
      {
        designId: design1.id,
        name: 'Ankara Cotton',
        color: 'Blue',
        colorHex: '#1E3A8A',
        priceAdjustment: 0,
        isAvailable: true,
      },
      {
        designId: design1.id,
        name: 'Damask Fabric',
        color: 'Gold',
        colorHex: '#FFA500',
        priceAdjustment: 5000,
        isAvailable: true,
      },
      {
        designId: design1.id,
        name: 'Silk Blend',
        color: 'Navy',
        colorHex: '#000080',
        priceAdjustment: 8000,
        isAvailable: true,
      },
    ],
  });
  console.log('✅ Added fabric options for design 1');

  // Add add-ons for design 1
  await prisma.designAddOn.createMany({
    data: [
      {
        designId: design1.id,
        name: 'Premium Embroidery',
        description: 'Intricate hand-stitched embroidery on collar and sleeves',
        price: 7500,
        isAvailable: true,
      },
      {
        designId: design1.id,
        name: 'Custom Cap',
        description: 'Matching traditional cap with embroidery',
        price: 5000,
        isAvailable: true,
      },
    ],
  });
  console.log('✅ Added add-ons for design 1');

  // Add size pricing for design 1
  await prisma.sizePricing.createMany({
    data: [
      { designId: design1.id, sizeLabel: 'M', priceAdjustment: 0 },
      { designId: design1.id, sizeLabel: 'L', priceAdjustment: 0 },
      { designId: design1.id, sizeLabel: 'XL', priceAdjustment: 2000 },
      { designId: design1.id, sizeLabel: 'XXL', priceAdjustment: 4000 },
      { designId: design1.id, sizeLabel: 'Custom', priceAdjustment: 5000 },
    ],
  });
  console.log('✅ Added size pricing for design 1');

  const design2 = await prisma.design.create({
    data: {
      designerId: designer1Profile.id,
      title: 'Elegant Ankara Gown',
      description: 'Floor-length Ankara gown with modern silhouette. Features side pockets and adjustable waist tie.',
      basePrice: 28000,
      currency: 'NGN',
      category: 'Gown',
      gender: 'female',
      estimatedDays: 10,
      isPublished: true,
      isActive: true,
    },
  });
  console.log('✅ Created design 2:', design2.title);

  // Add fabric options for design 2
  await prisma.fabricOption.createMany({
    data: [
      {
        designId: design2.id,
        name: 'Ankara Print',
        color: 'Multi',
        colorHex: '#FF6B6B',
        priceAdjustment: 0,
        isAvailable: true,
      },
      {
        designId: design2.id,
        name: 'Lace Fabric',
        color: 'White',
        colorHex: '#FFFFFF',
        priceAdjustment: 6000,
        isAvailable: true,
      },
    ],
  });

  // Add size pricing for design 2
  await prisma.sizePricing.createMany({
    data: [
      { designId: design2.id, sizeLabel: 'S', priceAdjustment: 0 },
      { designId: design2.id, sizeLabel: 'M', priceAdjustment: 0 },
      { designId: design2.id, sizeLabel: 'L', priceAdjustment: 1500 },
      { designId: design2.id, sizeLabel: 'XL', priceAdjustment: 3000 },
      { designId: design2.id, sizeLabel: 'Custom', priceAdjustment: 4000 },
    ],
  });

  const design3 = await prisma.design.create({
    data: {
      designerId: designer2Profile.id,
      title: 'Senator Suit',
      description: 'Modern African senator suit with matching trousers. Perfect for business and formal events.',
      basePrice: 35000,
      currency: 'NGN',
      category: 'Suit',
      gender: 'male',
      estimatedDays: 12,
      isPublished: true,
      isActive: true,
    },
  });
  console.log('✅ Created design 3:', design3.title);

  // Add fabric options for design 3
  await prisma.fabricOption.createMany({
    data: [
      {
        designId: design3.id,
        name: 'Cotton Blend',
        color: 'Black',
        colorHex: '#000000',
        priceAdjustment: 0,
        isAvailable: true,
      },
      {
        designId: design3.id,
        name: 'Linen',
        color: 'Cream',
        colorHex: '#FFFDD0',
        priceAdjustment: 4000,
        isAvailable: true,
      },
    ],
  });

  // Add size pricing for design 3
  await prisma.sizePricing.createMany({
    data: [
      { designId: design3.id, sizeLabel: 'M', priceAdjustment: 0 },
      { designId: design3.id, sizeLabel: 'L', priceAdjustment: 0 },
      { designId: design3.id, sizeLabel: 'XL', priceAdjustment: 2500 },
      { designId: design3.id, sizeLabel: 'XXL', priceAdjustment: 5000 },
      { designId: design3.id, sizeLabel: 'Custom', priceAdjustment: 6000 },
    ],
  });

  // 5. Create a sample customer
  const customerHash = await bcrypt.hash('Customer123!', 12);
  const customer = await prisma.user.create({
    data: {
      email: 'customer@steeze.com',
      passwordHash: customerHash,
      firstName: 'Oluchi',
      lastName: 'Adebayo',
      role: 'CUSTOMER',
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created sample customer:', customer.email);

  // Add address for customer
  await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Home',
      street: '45 Victoria Island Road',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      postalCode: '101241',
      isDefault: true,
      latitude: 6.4281,
      longitude: 3.4219,
    },
  });
  console.log('✅ Added address for customer');

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
