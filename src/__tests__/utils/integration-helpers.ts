/**
 * Integration test helpers for testing complete API workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

/**
 * Setup test database with seed data
 */
export async function setupTestDatabase() {
  // This would be used in integration tests
  // Clean database before each test
  await cleanupTestDatabase();

  // Create test users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      username: "admin",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@test.com",
      username: "teacher",
      password: hashedPassword,
      firstName: "Teacher",
      lastName: "User",
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  const student = await prisma.user.create({
    data: {
      email: "student@test.com",
      username: "student",
      password: hashedPassword,
      firstName: "Student",
      lastName: "User",
      role: "STUDENT",
      status: "ACTIVE",
      createdById: teacher.id,
    },
  });

  return { admin, teacher, student };
}

/**
 * Clean up test database after tests
 */
export async function cleanupTestDatabase() {
  // Delete in correct order due to foreign key constraints
  await prisma.task.deleteMany();
  await prisma.aIResult.deleteMany();
  await prisma.submissionReview.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.material.deleteMany();
  await prisma.subchapterVisibility.deleteMany();
  await prisma.chapterVisibility.deleteMany();
  await prisma.subchapter.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aIPromptTemplate.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.systemSettings.deleteMany();
}

/**
 * Create a test course with chapters and subchapters
 */
export async function createTestCourse(teacherId: string) {
  const course = await prisma.course.create({
    data: {
      title: "Test Course",
      description: "Test Description",
      teacherId,
    },
  });

  const chapter = await prisma.chapter.create({
    data: {
      title: "Test Chapter",
      description: "Chapter description",
      order: 1,
      courseId: course.id,
    },
  });

  const subchapter = await prisma.subchapter.create({
    data: {
      title: "Test Subchapter",
      description: "Subchapter description",
      order: 1,
      chapterId: chapter.id,
      allowSubmissions: true,
    },
  });

  return { course, chapter, subchapter };
}

/**
 * Enroll student in a course
 */
export async function enrollStudentInCourse(
  studentId: string,
  courseId: string
) {
  return await prisma.courseEnrollment.create({
    data: {
      studentId,
      courseId,
    },
  });
}

/**
 * Make content visible to student
 */
export async function makeContentVisible(
  studentId: string,
  chapterId: string,
  subchapterId: string
) {
  await prisma.chapterVisibility.create({
    data: {
      chapterId,
      studentId,
      isVisible: true,
    },
  });

  await prisma.subchapterVisibility.create({
    data: {
      subchapterId,
      studentId,
      isVisible: true,
      canSubmit: true,
    },
  });
}

/**
 * Create test submission
 */
export async function createTestSubmission(
  studentId: string,
  subchapterId: string
) {
  return await prisma.submission.create({
    data: {
      studentId,
      subchapterId,
      filePath: "/test/path/file.pdf",
      fileName: "test.pdf",
      fileSize: 1024,
      status: "PENDING",
    },
  });
}

/**
 * Wait for async operations
 */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
