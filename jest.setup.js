// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.EMAIL_FROM = "test@example.com";
process.env.SMTP_HOST = "smtp.test.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test@example.com";
process.env.SMTP_PASSWORD = "test-password";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));
// Mock next-auth
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

// Mock next-auth providers
jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: "credentials",
    name: "Credentials",
    type: "credentials",
    credentials: {},
    authorize: jest.fn(),
  })),
}));

// Mock @/lib/email
jest.mock("@/lib/email", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendEmailChangeConfirmation: jest.fn().mockResolvedValue(true),
}));

// Mock fs module
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from("test")),
  unlinkSync: jest.fn(),
}));

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));
