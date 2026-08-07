const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("TwojeHaslo123!", 10);

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

  console.log("Admin created:", admin.email);
}

createAdmin()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
