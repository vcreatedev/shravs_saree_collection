import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactInquiryEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/catalog";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(2, "Please enter a subject.").default("General Inquiry"),
  message: z.string().trim().min(5, "Please enter your message."),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = contactSchema.parse(json);
    const settings = await getSiteSettings();

    const result = await sendContactInquiryEmail(
      {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        subject: parsed.subject,
        message: parsed.message,
      },
      settings
    );

    if (!result.sent && result.reason?.includes("not configured")) {
      // In development or if key not yet set, we still acknowledge receipt
      console.warn(`[contact] Email skipped (${result.reason}):`, parsed);
      return NextResponse.json({
        success: true,
        message: "Thank you! Your message has been received. Our team will get back to you shortly.",
      });
    }

    if (!result.sent) {
      console.error("[contact] Failed to send email:", result.reason);
      return NextResponse.json(
        { error: "Could not send message right now. Please message us on WhatsApp instead." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your message has been sent. We will get back to you shortly.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid form data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

