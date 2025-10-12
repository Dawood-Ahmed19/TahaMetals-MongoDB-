import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const response = await resend.emails.send({
      from: "Taha Metals <onboarding@resend.dev>",
      to: email,
      subject: "Verify your Taha Metals account",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    });

    console.log("Email sent:", response);
    return response;
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
}
