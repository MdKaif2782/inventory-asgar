import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Dashboard
  'dashboard.view',
  // Products
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  // Godowns
  'godowns.view',
  'godowns.create',
  'godowns.update',
  'godowns.delete',
  // Stock
  'stock.view',
  // Purchases
  'purchases.view',
  'purchases.create',
  // Sales
  'sales.view',
  'sales.create',
  // Reports
  'reports.view',
  // Users
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  // Roles
  'roles.view',
  'roles.create',
  'roles.update',
  'roles.delete',
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create all permissions
  const permissionRecords: { id: string; name: string }[] = [];
  for (const name of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    permissionRecords.push(perm);
  }
  console.log(`✅ Created ${permissionRecords.length} permissions`);

  // Create Admin role with all permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      permissions: {
        set: permissionRecords.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'Admin',
      permissions: {
        connect: permissionRecords.map((p) => ({ id: p.id })),
      },
    },
  });
  console.log('✅ Created Admin role');

  // Create Manager role
  const managerPermissions = permissionRecords.filter(
    (p) =>
      !p.name.startsWith('users.') &&
      !p.name.startsWith('roles.'),
  );
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {
      permissions: {
        set: managerPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'Manager',
      permissions: {
        connect: managerPermissions.map((p) => ({ id: p.id })),
      },
    },
  });
  console.log('✅ Created Manager role');

  // Create Viewer role
  const viewerPermissions = permissionRecords.filter((p) =>
    p.name.endsWith('.view'),
  );
  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {
      permissions: {
        set: viewerPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'Viewer',
      permissions: {
        connect: viewerPermissions.map((p) => ({ id: p.id })),
      },
    },
  });
  console.log('✅ Created Viewer role');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@inventory.com',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });
  console.log('✅ Created admin user (admin@inventory.com / admin123)');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
