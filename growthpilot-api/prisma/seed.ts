import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean the database in order to respect constraints
  await prisma.communicationEvent.deleteMany({});
  await prisma.communication.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  // Seed customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '+15550100',
      city: 'New York',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      phone: '+15550200',
      city: 'Los Angeles',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Charlie Brown',
      email: 'charlie.brown@example.com',
      phone: '+15550300',
      city: 'Chicago',
    },
  });

  // Seed orders
  await prisma.order.createMany({
    data: [
      {
        customerId: customer1.id,
        orderTotal: 120.50,
        currency: 'USD',
        channel: 'online',
        status: 'completed',
        orderedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        customerId: customer1.id,
        orderTotal: 45.00,
        currency: 'USD',
        channel: 'mobile',
        status: 'completed',
        orderedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        customerId: customer2.id,
        orderTotal: 350.00,
        currency: 'USD',
        channel: 'online',
        status: 'completed',
        orderedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        customerId: customer3.id,
        orderTotal: 15.75,
        currency: 'USD',
        channel: 'retail',
        status: 'cancelled',
        orderedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      },
    ],
  });

  // Seed segments
  const vipSegment = await prisma.segment.create({
    data: {
      name: 'VIP Shoppers',
      description: 'Customers who spent at least $100',
      ruleJson: { totalSpent_gte: 100 },
      aiGenerated: false,
    },
  });

  const nycSegment = await prisma.segment.create({
    data: {
      name: 'New York Shoppers',
      description: 'Customers located in New York City',
      ruleJson: { city: 'New York' },
      aiGenerated: true,
    },
  });

  // Seed draft campaign
  await prisma.campaign.create({
    data: {
      name: 'VIP Appreciation Campaign',
      objective: 'Reward high value customers with discount coupons',
      segmentId: vipSegment.id,
      messageTemplate: 'Hello {{name}}, thank you for being a VIP shopper! Use code VIP20 for 20% off your next purchase.',
      channel: 'whatsapp',
      status: 'draft',
    },
  });

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
