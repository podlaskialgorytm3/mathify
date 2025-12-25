import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists:", existingAdmin.email);
    return;
  }

  // Create default admin
  const hashedPassword = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@mathify.app",
      username: "admin",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Mathify",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("✅ Created admin user:");
  console.log("   Email:", admin.email);
  console.log("   Username:", admin.username);
  console.log("   Password: Admin123!");
  console.log("");
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
