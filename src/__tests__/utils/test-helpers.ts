import { NextRequest } from "next/server";
import { UserRole, UserStatus } from "@prisma/client";

export interface MockSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
  };
  expires: string;
}

export function createMockSession(
  role: UserRole = "STUDENT",
  userId: string = "test-user-id"
): MockSession {
  return {
    user: {
      id: userId,
      email: "test@example.com",
      name: "Test User",
      role,
      status: "ACTIVE" as UserStatus,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {}, searchParams = {} } = options;

  const urlWithParams = new URL(url, "http://localhost:3000");
  Object.entries(searchParams).forEach(([key, value]) => {
    urlWithParams.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlWithParams.toString(), requestInit);
}

export function mockPrismaUser(overrides = {}) {
  return {
    id: "user-id",
    email: "user@example.com",
    username: "testuser",
    password: "hashedpassword",
    firstName: "Test",
    lastName: "User",
    role: "STUDENT" as UserRole,
    status: "ACTIVE" as UserStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: new Date(),
    planId: null,
    createdById: null,
    ...overrides,
  };
}

export function mockPrismaCourse(overrides = {}) {
  return {
    id: "course-id",
    title: "Test Course",
    description: "Test Description",
    teacherId: "teacher-id",
    aiPromptTemplateId: null,
    homeworkFileName: "Praca Domowa",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockPrismaChapter(overrides = {}) {
  return {
    id: "chapter-id",
    title: "Test Chapter",
    description: "Chapter Description",
    order: 1,
    courseId: "course-id",
    visibilityType: "MANUAL" as const,
    visibleFromDate: null,
    visibleUntilDate: null,
    requiresPrevious: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockPrismaSubchapter(overrides = {}) {
  return {
    id: "subchapter-id",
    title: "Test Subchapter",
    description: "Subchapter Description",
    order: 1,
    chapterId: "chapter-id",
    visibilityType: "MANUAL" as const,
    visibleFromDate: null,
    visibleUntilDate: null,
    requiresPrevious: false,
    allowSubmissions: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockPrismaSubmission(overrides = {}) {
  return {
    id: "submission-id",
    subchapterId: "subchapter-id",
    studentId: "student-id",
    filePath: "/uploads/submissions/test.pdf",
    fileName: "test.pdf",
    fileSize: 1024,
    status: "PENDING" as const,
    submittedAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockPrismaMaterial(overrides = {}) {
  return {
    id: "material-id",
    title: "Test Material",
    description: "Material Description",
    type: "PDF" as const,
    content: "/uploads/materials/test.pdf",
    order: 1,
    subchapterId: "subchapter-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockPrismaAIPromptTemplate(overrides = {}) {
  return {
    id: "prompt-id",
    teacherId: "teacher-id",
    name: "Test Prompt",
    prompt: "Test prompt text",
    description: "Prompt description",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export async function getResponseBody(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
