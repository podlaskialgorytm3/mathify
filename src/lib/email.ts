import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendAccountApprovalEmail(
  email: string,
  firstName: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Witaj w Mathify!</h2>
      <p>Cześć ${firstName},</p>
      <p>Twoje konto zostało zatwierdzone przez administratora.</p>
      <p>Możesz teraz zalogować się do aplikacji:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Zaloguj się
      </a>
      <p>Pozdrawiamy,<br/>Zespół Mathify</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Twoje konto zostało aktywowane - Mathify",
    html,
  });
}

export async function sendSubmissionReviewedEmail(
  email: string,
  firstName: string,
  submissionId: string,
  courseName: string,
  approved: boolean
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Twoja praca została sprawdzona</h2>
      <p>Cześć ${firstName},</p>
      <p>Nauczyciel sprawdził Twoją pracę domową z kursu: <strong>${courseName}</strong></p>
      <p>Status: <strong style="color: ${approved ? "#16a34a" : "#dc2626"}">
        ${approved ? "Zaakceptowana" : "Wymaga poprawy"}
      </strong></p>
      <p>Zobacz szczegóły i feedback:</p>
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard/submissions/${submissionId}" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Zobacz wyniki
      </a>
      <p>Pozdrawiamy,<br/>Zespół Mathify</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Sprawdzono pracę domową - ${courseName}`,
    html,
  });
}

export async function sendNewSubmissionEmail(
  email: string,
  teacherName: string,
  studentName: string,
  courseName: string,
  submissionId: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nowa praca domowa do sprawdzenia</h2>
      <p>Cześć ${teacherName},</p>
      <p>Uczeń <strong>${studentName}</strong> przesłał pracę domową do kursu: <strong>${courseName}</strong></p>
      <p>Praca została automatycznie sprawdzona przez AI i oczekuje na Twoją weryfikację.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher/submissions/${submissionId}" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Sprawdź pracę
      </a>
      <p>Pozdrawiamy,<br/>Zespół Mathify</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Nowa praca do sprawdzenia - ${courseName}`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Witaj w Mathify!</h2>
      <p>Cześć ${firstName},</p>
      <p>Dziękujemy za rejestrację w aplikacji Mathify.</p>
      <p>Twoje konto oczekuje na zatwierdzenie przez administratora. Otrzymasz powiadomienie email, gdy Twoje konto zostanie aktywowane.</p>
      <p>Pozdrawiamy,<br/>Zespół Mathify</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Witaj w Mathify - Oczekiwanie na aktywację konta",
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mathify</h1>
          </div>
          <div class="content">
            <h2>Cześć ${userName}!</h2>
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
            <p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
            <a href="${resetUrl}" class="button" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Zresetuj hasło</a>
            <p>Lub skopiuj i wklej ten link do przeglądarki:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <p><strong>Link jest ważny przez 1 godzinę.</strong></p>
            <p>Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.</p>
          </div>
          <div class="footer">
            <p>© 2025 Mathify. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Mathify - Resetowanie hasła",
    html,
  });
}

export async function sendEmailChangeConfirmation(
  newEmail: string,
  token: string,
  userName: string
) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mathify</h1>
          </div>
          <div class="content">
            <h2>Cześć ${userName}!</h2>
            <p>Otrzymaliśmy prośbę o zmianę adresu email Twojego konta na: <strong>${newEmail}</strong></p>
            <p>Aby potwierdzić zmianę, kliknij poniższy przycisk:</p>
            <a href="${confirmUrl}" class="button" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Potwierdź zmianę email</a>
            <p>Lub skopiuj i wklej ten link do przeglądarki:</p>
            <p style="word-break: break-all; color: #2563eb;">${confirmUrl}</p>
            <p><strong>Link jest ważny przez 1 godzinę.</strong></p>
            <p>Jeśli nie prosiłeś o zmianę adresu email, zignoruj tę wiadomość lub skontaktuj się z administratorem.</p>
          </div>
          <div class="footer">
            <p>© 2025 Mathify. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: newEmail,
    subject: "Mathify - Potwierdzenie zmiany adresu email",
    html,
  });
}
