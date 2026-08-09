import type { HouseholdSubmission } from "@/lib/household-schema";
import {
  escapeHtml,
  sendEmail,
  siteUrl,
  type EmailContent,
  type SendEmailResult
} from "@/lib/email-delivery";
import type { HouseholdSaveResult } from "@/lib/household-persistence";

function notificationRecipients() {
  return (process.env.COUPLE_NOTIFICATION_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function addressLines(input: HouseholdSubmission) {
  return [
    input.streetAddress,
    input.unit,
    `${input.city}, ${input.provinceState} ${input.postalZip}`,
    input.country
  ].filter(Boolean);
}

function memberNames(input: HouseholdSubmission) {
  return input.members.map((member) => `${member.firstName} ${member.lastName}`.trim());
}

function rows(items: Array<[string, string | null | undefined]>) {
  return items
    .map(([label, value]) => {
      const displayValue = value?.trim() || "Not provided";

      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(178,154,104,0.22);color:rgba(32,32,30,0.58);font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(178,154,104,0.22);color:#20201e;font-size:16px;line-height:1.45;vertical-align:top;">${escapeHtml(displayValue).replaceAll("\n", "<br>")}</td>
      </tr>`;
    })
    .join("");
}

export function buildCoupleNotificationEmail(
  input: HouseholdSubmission,
  saveStatus: HouseholdSaveResult["status"]
): EmailContent {
  const isUpdate = saveStatus === "updated";
  const primaryName = `${input.primaryFirstName} ${input.primaryLastName}`.trim();
  const adminUrl = `${siteUrl()}/admin`;
  const subject = `${isUpdate ? "Updated" : "New"} mailing details: ${primaryName}`;
  const members = memberNames(input).join("\n");
  const address = addressLines(input).join("\n");
  const submittedLabel = isUpdate ? "Updated submission" : "New submission";

  const text = `${submittedLabel}

Primary contact
${primaryName}
${input.primaryEmail}
${input.primaryPhone ?? "No phone provided"}

Mailing address
${address}

Household members
${members}

Notes
${input.notes ?? "No notes provided"}

View the admin dashboard:
${adminUrl}`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f7f4ec;color:#20201e;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ec;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf7;border:1px solid rgba(178,154,104,0.34);border-radius:8px;box-shadow:0 18px 48px rgba(32,32,30,0.08);">
            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 12px;color:#4d5948;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(submittedLabel)}</p>
                <h1 style="margin:0;color:#20201e;font-size:34px;font-weight:400;line-height:1.08;">${escapeHtml(primaryName)}</h1>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid rgba(178,154,104,0.34);border-collapse:collapse;">
                  ${rows([
                    ["Email", input.primaryEmail],
                    ["Phone", input.primaryPhone],
                    ["Address", address],
                    ["Members", members],
                    ["Notes", input.notes]
                  ])}
                </table>
                <a href="${escapeHtml(adminUrl)}" style="display:inline-block;margin-top:26px;border-radius:999px;background:#4d5948;color:#fffdf7;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1;text-decoration:none;padding:14px 22px;">Open admin dashboard</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, subject, text };
}

export async function sendCoupleNotificationEmail(
  input: HouseholdSubmission,
  saveStatus: HouseholdSaveResult["status"]
): Promise<SendEmailResult> {
  const recipients = notificationRecipients();

  if (recipients.length === 0) {
    return { status: "not_configured" };
  }

  return sendEmail({
    ...buildCoupleNotificationEmail(input, saveStatus),
    to: recipients
  });
}
