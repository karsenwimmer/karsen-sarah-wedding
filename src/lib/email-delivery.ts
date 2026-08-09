import { weddingConfig } from "@/config/wedding";
import type { ConfirmationEmailStatus } from "@/lib/household-persistence";

const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

export type EmailContent = {
  html: string;
  subject: string;
  text: string;
};

export type SendEmailResult = {
  status: ConfirmationEmailStatus;
  errorMessage?: string;
};

export type SendEmailInput = EmailContent & {
  to: string | string[];
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatFromAddress(value: string) {
  return value.includes("<") ? value : `${weddingConfig.couple.displayName} <${value}>`;
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? weddingConfig.links.websiteUrl;
}

async function readResendError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { status: "not_configured" };
  }

  try {
    const response = await fetch(RESEND_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: formatFromAddress(fromEmail),
        to: input.to,
        reply_to: process.env.RESEND_REPLY_TO ?? fromEmail,
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    if (!response.ok) {
      return {
        status: "failed",
        errorMessage: await readResendError(response)
      };
    }

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown email delivery error"
    };
  }
}
