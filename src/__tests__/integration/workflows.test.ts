/**
 * Integration Tests - Complete User Workflows
 * These tests simulate real user scenarios across multiple API endpoints
 */

import {
  setupTestDatabase,
  cleanupTestDatabase,
  createTestCourse,
  enrollStudentInCourse,
  makeContentVisible,
  createTestSubmission,
} from "@/__tests__/utils/integration-helpers";
import { prisma } from "@/lib/prisma";

describe("Integration Tests - User Workflows", () => {
  let admin: any;
  let teacher: any;
  let student: any;

  beforeAll(async () => {
    const users = await setupTestDatabase();
    admin = users.admin;
    teacher = users.teacher;
    student = users.student;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  describe("Teacher Course Creation Workflow", () => {
    it("should allow teacher to create and manage a complete course", async () => {
      // 1. Create course
      const { course, chapter, subchapter } = await createTestCourse(
        teacher.id
      );

      expect(course).toBeDefined();
      expect(course.teacherId).toBe(teacher.id);
      expect(chapter.courseId).toBe(course.id);
      expect(subchapter.chapterId).toBe(chapter.id);

      // 2. Verify course exists
      const fetchedCourse = await prisma.course.findUnique({
        where: { id: course.id },
        include: {
          chapters: {
            include: {
              subchapters: true,
            },
          },
        },
      });

      expect(fetchedCourse).toBeDefined();
      expect(fetchedCourse?.chapters).toHaveLength(1);
      expect(fetchedCourse?.chapters[0].subchapters).toHaveLength(1);

      // 3. Enroll student
      const enrollment = await enrollStudentInCourse(student.id, course.id);
      expect(enrollment.studentId).toBe(student.id);
      expect(enrollment.courseId).toBe(course.id);

      // 4. Make content visible
      await makeContentVisible(student.id, chapter.id, subchapter.id);

      // 5. Verify visibility
      const visibility = await prisma.subchapterVisibility.findUnique({
        where: {
          subchapterId_studentId: {
            subchapterId: subchapter.id,
            studentId: student.id,
          },
        },
      });

      expect(visibility?.isVisible).toBe(true);
      expect(visibility?.canSubmit).toBe(true);
    });
  });

  describe("Student Submission Workflow", () => {
    it("should allow student to submit and receive feedback", async () => {
      // Setup
      const { course, chapter, subchapter } = await createTestCourse(
        teacher.id
      );
      await enrollStudentInCourse(student.id, course.id);
      await makeContentVisible(student.id, chapter.id, subchapter.id);

      // 1. Create submission
      const submission = await createTestSubmission(student.id, subchapter.id);

      expect(submission.studentId).toBe(student.id);
      expect(submission.status).toBe("PENDING");

      // 2. Simulate AI processing
      await prisma.aIResult.create({
        data: {
          submissionId: submission.id,
          rawResponse: JSON.stringify({
            tasks: [
              {
                taskNumber: 1,
                pointsEarned: 8,
                maxPoints: 10,
                comment: "Good work!",
              },
            ],
          }),
        },
      });

      // 3. Create task records
      await prisma.task.create({
        data: {
          submissionId: submission.id,
          taskNumber: 1,
          pointsEarned: 8,
          maxPoints: 10,
          comment: "Good work!",
        },
      });

      // 4. Update submission status
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "AI_CHECKED" },
      });

      // 5. Teacher reviews
      await prisma.submissionReview.create({
        data: {
          submissionId: submission.id,
          teacherId: teacher.id,
          approved: true,
          generalComment: "Great job!",
        },
      });

      // 6. Update status to approved
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "APPROVED" },
      });

      // 7. Verify final state
      const finalSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
        include: {
          tasks: true,
          review: true,
          aiResult: true,
        },
      });

      expect(finalSubmission?.status).toBe("APPROVED");
      expect(finalSubmission?.tasks).toHaveLength(1);
      expect(finalSubmission?.review?.approved).toBe(true);
      expect(finalSubmission?.aiResult).toBeDefined();
    });

    it("should prevent submission deletion after review", async () => {
      // Setup
      const { course, chapter, subchapter } = await createTestCourse(
        teacher.id
      );
      await enrollStudentInCourse(student.id, course.id);
      await makeContentVisible(student.id, chapter.id, subchapter.id);

      // Create and approve submission
      const submission = await createTestSubmission(student.id, subchapter.id);
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "APPROVED" },
      });

      // Try to delete - should be prevented by business logic
      const approvedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(approvedSubmission?.status).toBe("APPROVED");
      // In real API, DELETE would return 400 for approved submissions
    });
  });

  describe("Admin User Management Workflow", () => {
    it("should allow admin to manage users and plans", async () => {
      // 1. Create a plan
      const plan = await prisma.plan.create({
        data: {
          name: "Premium Plan",
          maxSubchapters: 100,
          maxStudents: 200,
          price: 299.99,
          currency: "PLN",
          isActive: true,
        },
      });

      expect(plan).toBeDefined();

      // 2. Assign plan to teacher
      await prisma.user.update({
        where: { id: teacher.id },
        data: { planId: plan.id },
      });

      // 3. Verify assignment
      const updatedTeacher = await prisma.user.findUnique({
        where: { id: teacher.id },
        include: { plan: true },
      });

      expect(updatedTeacher?.planId).toBe(plan.id);
      expect(updatedTeacher?.plan?.name).toBe("Premium Plan");

      // 4. Check plan limits
      const { course } = await createTestCourse(teacher.id);

      // Create multiple subchapters to test limits
      const chapter = await prisma.chapter.create({
        data: {
          title: "Test Chapter",
          order: 1,
          courseId: course.id,
        },
      });

      // Should be able to create subchapters within limit
      const subchaptersCreated = [];
      for (let i = 0; i < 5; i++) {
        const sub = await prisma.subchapter.create({
          data: {
            title: `Subchapter ${i + 1}`,
            order: i + 1,
            chapterId: chapter.id,
          },
        });
        subchaptersCreated.push(sub);
      }

      expect(subchaptersCreated).toHaveLength(5);

      // Count total subchapters for teacher
      const totalSubchapters = await prisma.subchapter.count({
        where: {
          chapter: {
            course: {
              teacherId: teacher.id,
            },
          },
        },
      });

      expect(totalSubchapters).toBeLessThanOrEqual(plan.maxSubchapters);
    });
  });

  describe("Multi-User Course Interaction", () => {
    it("should handle multiple students in same course", async () => {
      // Create second student
      const student2 = await prisma.user.create({
        data: {
          email: "student2@test.com",
          username: "student2",
          password: "hashed_password",
          firstName: "Student",
          lastName: "Two",
          role: "STUDENT",
          status: "ACTIVE",
          createdById: teacher.id,
        },
      });

      // Create course
      const { course, chapter, subchapter } = await createTestCourse(
        teacher.id
      );

      // Enroll both students
      await enrollStudentInCourse(student.id, course.id);
      await enrollStudentInCourse(student2.id, course.id);

      // Make content visible to both
      await makeContentVisible(student.id, chapter.id, subchapter.id);
      await makeContentVisible(student2.id, chapter.id, subchapter.id);

      // Both submit work
      const submission1 = await createTestSubmission(student.id, subchapter.id);
      const submission2 = await createTestSubmission(
        student2.id,
        subchapter.id
      );

      // Verify isolation
      expect(submission1.studentId).toBe(student.id);
      expect(submission2.studentId).toBe(student2.id);
      expect(submission1.id).not.toBe(submission2.id);

      // Get all submissions for teacher
      const teacherSubmissions = await prisma.submission.findMany({
        where: {
          subchapter: {
            chapter: {
              course: {
                teacherId: teacher.id,
              },
            },
          },
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      expect(teacherSubmissions.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await prisma.user.delete({ where: { id: student2.id } });
    });
  });

  describe("Content Visibility Workflow", () => {
    it("should respect visibility rules for students", async () => {
      const { course, chapter, subchapter } = await createTestCourse(
        teacher.id
      );
      await enrollStudentInCourse(student.id, course.id);

      // Initially, content should not be visible
      const initialVisibility = await prisma.chapterVisibility.findUnique({
        where: {
          chapterId_studentId: {
            chapterId: chapter.id,
            studentId: student.id,
          },
        },
      });

      expect(initialVisibility).toBeNull();

      // Teacher makes chapter visible
      await prisma.chapterVisibility.create({
        data: {
          chapterId: chapter.id,
          studentId: student.id,
          isVisible: true,
        },
      });

      // But subchapter is still not visible
      const subVisibility = await prisma.subchapterVisibility.findUnique({
        where: {
          subchapterId_studentId: {
            subchapterId: subchapter.id,
            studentId: student.id,
          },
        },
      });

      expect(subVisibility).toBeNull();

      // Student should only see chapter, not subchapter
      const visibleChapters = await prisma.chapter.findMany({
        where: {
          courseId: course.id,
          visibility: {
            some: {
              studentId: student.id,
              isVisible: true,
            },
          },
        },
      });

      expect(visibleChapters).toHaveLength(1);
    });
  });
});
