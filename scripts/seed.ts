

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting store seed...');

  // Create demo stores
  const store1 = await prisma.store.create({
    data: {
      name: 'Downtown Store',
      address: '123 Main Street, Downtown',
      phone: '(555) 123-4567',
      settings: {
        create: {
          morningStart: '06:00',
          morningEnd: '14:00',
          afternoonStart: '14:00',
          afternoonEnd: '22:00',
        },
      },
      userStores: {
        create: [
          {
            user: {
              connectOrCreate: {
                where: { email: 'manager@lottery.com' },
                create: {
                  id: 'manager-001',
                  email: 'manager@lottery.com',
                  password: 'manager123',
                  firstName: 'Store',
                  lastName: 'Manager',
                  role: 'manager',
                },
              },
            },
          },
          {
            user: {
              connectOrCreate: {
                where: { email: 'cashier@lottery.com' },
                create: {
                  id: 'cashier-001',
                  email: 'cashier@lottery.com',
                  password: 'cashier123',
                  firstName: 'Cashier',
                  lastName: 'User',
                  role: 'cashier',
                },
              },
            },
          },
        ],
      },
    },
  });

  const store2 = await prisma.store.create({
    data: {
      name: 'Uptown Store',
      address: '456 Oak Avenue, Uptown',
      phone: '(555) 987-6543',
      settings: {
        create: {
          morningStart: '07:00',
          morningEnd: '15:00',
          afternoonStart: '15:00',
          afternoonEnd: '23:00',
        },
      },
      userStores: {
        create: [
          {
            user: {
              connect: { email: 'manager@lottery.com' },
            },
          },
        ],
      },
    },
  });

  const store3 = await prisma.store.create({
    data: {
      name: 'Westside Store',
      address: '789 Pine Road, Westside',
      phone: '(555) 456-7890',
      settings: {
        create: {
          morningStart: '06:00',
          morningEnd: '14:00',
          afternoonStart: '14:00',
          afternoonEnd: '22:00',
        },
      },
      userStores: {
        create: [
          {
            user: {
              connect: { email: 'manager@lottery.com' },
            },
          },
        ],
      },
    },
  });

  console.log('Created stores:');
  console.log('- Downtown Store:', store1.id);
  console.log('- Uptown Store:', store2.id);
  console.log('- Westside Store:', store3.id);
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
