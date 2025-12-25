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
