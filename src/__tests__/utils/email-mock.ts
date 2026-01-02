/**
 * Mock utilities for email functionality
 */

export const mockEmailService = {
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendEmailChangeConfirmation: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true),
};

export function mockEmailFunctions() {
  jest.mock("@/lib/email", () => mockEmailService);
}

export function resetEmailMocks() {
  Object.values(mockEmailService).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
}
