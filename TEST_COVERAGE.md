# Test Coverage Report

## Overview

This document provides an overview of the test coverage for the Mathify backend API.

## API Endpoints Coverage

### Authentication API

- ✅ POST /api/auth/register - User registration
- ✅ POST /api/auth/[...nextauth] - Login/Authentication
- ✅ Session management and JWT tokens

### Admin API

- ✅ GET /api/admin/users - List all users
- ✅ POST /api/admin/users - Create user (indirectly tested)
- ✅ GET /api/admin/users/[id] - Get user details
- ✅ PUT /api/admin/users/[id] - Update user
- ✅ GET /api/admin/courses - List all courses
- ✅ POST /api/admin/courses - Create course
- ✅ GET /api/admin/plans - List subscription plans
- ✅ POST /api/admin/plans - Create plan
- ✅ POST /api/admin/assign-plan - Assign plan to teacher
- ✅ GET /api/admin/teachers - List teachers
- ✅ GET /api/admin/teachers-with-plans - Teachers with plan details

### Teacher API

- ✅ GET /api/teacher/courses - List teacher's courses
- ✅ POST /api/teacher/courses - Create new course
- ✅ GET /api/teacher/courses/[id] - Get course details
- ✅ PUT /api/teacher/courses/[id] - Update course
- ✅ DELETE /api/teacher/courses/[id] - Delete course
- ✅ POST /api/teacher/courses/[id]/enroll - Enroll student
- ✅ GET /api/teacher/submissions - List submissions
- ✅ GET /api/teacher/submissions/[id] - Get submission details
- ✅ PUT /api/teacher/submissions/[id] - Review submission
- ✅ DELETE /api/teacher/submissions/[id] - Delete submission
- ✅ GET /api/teacher/ai-prompts - List AI prompts
- ✅ POST /api/teacher/ai-prompts - Create AI prompt
- ✅ PUT /api/teacher/ai-prompts/[id] - Update AI prompt
- ✅ DELETE /api/teacher/ai-prompts/[id] - Delete AI prompt
- ✅ POST /api/teacher/create-student - Create student account
- ✅ POST /api/teacher/reset-student-password - Reset student password
- ✅ GET /api/teacher/students - List students
- ✅ GET /api/teacher/students/[studentId] - Get student details
- ✅ POST /api/teacher/subchapters/[id]/materials - Add material
- ✅ GET /api/teacher/subchapters/[id]/materials - List materials

### Student API

- ✅ GET /api/student/courses - List enrolled courses
- ✅ GET /api/student/courses/[courseId] - Get course details
- ✅ GET /api/student/courses/[courseId]/subchapters/[subchapterId] - Get subchapter
- ✅ GET /api/student/submissions - List submissions
- ✅ POST /api/student/submissions - Submit homework
- ✅ DELETE /api/student/submissions - Delete submission

### Profile API

- ✅ GET /api/profile - Get user profile
- ✅ PUT /api/profile - Update profile
- ✅ POST /api/profile/request-password-reset - Request password reset
- ✅ POST /api/profile/reset-password - Reset password with token
- ✅ POST /api/profile/request-email-change - Request email change
- ✅ POST /api/profile/confirm-email - Confirm email

## Test Categories

### Unit Tests

- Authentication and authorization logic
- Data validation
- Business logic for each endpoint
- Error handling
- Role-based access control

### Security Tests

- Authorization checks for each role (ADMIN, TEACHER, STUDENT)
- Token validation
- Password hashing and comparison
- Input sanitization

### Data Validation Tests

- Required field validation
- Data type validation
- Email format validation
- Business rule validation

### Error Handling Tests

- Database errors
- Invalid input
- Missing authentication
- Insufficient permissions
- Not found scenarios

## Test Statistics

### By Module

- **Auth Tests**: 12 test cases
- **Admin Tests**: 18 test cases
- **Teacher Tests**: 24 test cases
- **Student Tests**: 16 test cases
- **Profile Tests**: 14 test cases

### Total: 84+ test cases

## Utilities and Helpers

### Test Helpers

- `createMockSession()` - Mock authenticated sessions
- `createMockRequest()` - Mock HTTP requests
- `mockPrismaUser()` - Mock user data
- `mockPrismaCourse()` - Mock course data
- `mockPrismaSubmission()` - Mock submission data
- `getResponseBody()` - Parse response data

### Mocks

- Prisma database client
- Bcrypt password hashing
- Google Gemini AI
- Email service
- File system operations

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run in CI mode
npm run test:ci

# Run specific test file
npm test -- src/__tests__/api/auth/register.test.ts
```

## Coverage Goals

- **Target**: 80% overall coverage
- **Critical paths**: 100% coverage (authentication, authorization)
- **Business logic**: 90% coverage
- **Error handlers**: 85% coverage

## Next Steps

1. Add integration tests for complex workflows
2. Add performance tests for heavy operations
3. Add end-to-end tests for critical user journeys
4. Implement load testing for API endpoints
5. Add tests for file upload functionality
6. Add tests for AI integration with actual Gemini API

## Notes

- All tests use mocked dependencies to ensure fast execution
- Tests are isolated and can run in parallel
- Database operations are mocked to avoid test data pollution
- File system operations are mocked for safety

## Maintenance

- Run tests before each commit
- Update tests when changing API contracts
- Keep test data and mocks up to date
- Review and update this document regularly
