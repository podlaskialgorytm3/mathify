const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.update({
    where: { email: "admin@mathify.app" },
    data: {
      password: hashedPassword,
    },
  });

  console.log("Admin password reset successfully for:", admin.email);
}

resetAdminPassword()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
