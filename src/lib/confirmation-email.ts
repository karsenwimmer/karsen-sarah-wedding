import type { HouseholdSubmission } from "@/lib/household-schema";
import {
  escapeHtml,
  sendEmail,
  siteUrl,
  type EmailContent,
  type SendEmailResult
} from "@/lib/email-delivery";

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function addressLines(input: HouseholdSubmission) {
  return [
    input.streetAddress,
    input.unit,
    `${input.city}, ${input.provinceState} ${input.postalZip}`,
    input.country
  ].filter((line): line is string => Boolean(line));
}

function additionalPeople(input: HouseholdSubmission) {
  return input.members
    .slice(1)
    .map((member) => fullName(member.firstName, member.lastName))
    .filter(Boolean);
}

function detailRows(rows: Array<[string, string]>) {
  return rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:11px 0;border-bottom:1px solid rgba(178,154,104,0.2);color:rgba(32,32,30,0.54);font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:11px 0 11px 18px;border-bottom:1px solid rgba(178,154,104,0.2);color:#20201e;font-size:16px;line-height:1.45;text-align:left;vertical-align:top;">${escapeHtml(value).replaceAll("\n", "<br>")}</td>
      </tr>`
    )
    .join("");
}

export function buildConfirmationEmail(input: HouseholdSubmission): EmailContent {
  const escapedFirstName = escapeHtml(input.primaryFirstName);
  const escapedSiteUrl = escapeHtml(siteUrl());
  const primaryName = fullName(input.primaryFirstName, input.primaryLastName);
  const otherPeople = additionalPeople(input);
  const otherPeopleText = otherPeople.length > 0 ? otherPeople.join("\n") : "None listed";
  const mailingAddress = addressLines(input).join("\n");
  const subject = "We received your wedding mailing details";
  const preheader =
    "Thank you for sharing your contact information for Karsen & Sarah's wedding.";
  const text = `Hi ${input.primaryFirstName},

Thank you for sharing your household details for our wedding.

We've received your mailing and contact information, which we'll use to send your formal invitation and share important wedding updates as plans are finalized.

This is not an RSVP. Formal invitation and RSVP details will follow at a later date.

Details submitted
Primary contact: ${primaryName}
Additional people:
${otherPeopleText}
Email address: ${input.primaryEmail}
Mailing address:
${mailingAddress}

If anything needs to be changed, please resubmit the form. The newest submission will be kept.

Karsen & Sarah
07 - 17 - 27
The Boathouse Restaurant & Event Venue
Bronte Harbour · Oakville, Ontario

Visit our wedding website:
${siteUrl()}`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f7f4ec;color:#20201e;font-family:Georgia,'Times New Roman',serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ec;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf7;border:1px solid rgba(178,154,104,0.34);border-radius:8px;box-shadow:0 18px 48px rgba(32,32,30,0.08);">
            <tr>
              <td style="padding:34px 32px 30px;text-align:center;">
                <div style="margin:0 auto 22px;width:82px;height:82px;border:1px solid rgba(178,154,104,0.72);border-radius:999px;color:#b29a68;line-height:82px;font-size:28px;letter-spacing:0.02em;">K&amp;S</div>
                <p style="margin:0 0 14px;color:#4d5948;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Details Received</p>
                <h1 style="margin:0;color:#20201e;font-size:38px;font-weight:400;line-height:1.02;">Thank you, ${escapedFirstName}</h1>
                <p style="margin:24px auto 0;max-width:440px;color:rgba(32,32,30,0.76);font-size:18px;line-height:1.65;">We've received your mailing and contact information, which we'll use to send your formal invitation and share important wedding updates as plans are finalized.</p>
                <p style="margin:22px auto 0;max-width:420px;color:#4d5948;font-size:17px;font-style:italic;line-height:1.55;">This is not an RSVP. Formal invitation and RSVP details will follow at a later date.</p>
                <div style="margin:30px auto 0;max-width:440px;padding:20px 22px;border:1px solid rgba(178,154,104,0.28);border-radius:8px;background:rgba(247,244,236,0.45);text-align:left;">
                  <p style="margin:0 0 10px;color:#4d5948;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Details submitted</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    ${detailRows([
                      ["Primary contact", primaryName],
                      ["Additional people", otherPeopleText],
                      ["Email address", input.primaryEmail],
                      ["Mailing address", mailingAddress]
                    ])}
                  </table>
                  <p style="margin:16px 0 0;color:rgba(32,32,30,0.68);font-size:15px;font-style:italic;line-height:1.55;text-align:center;">If anything needs to be changed, please resubmit the form. The newest submission will be kept.</p>
                </div>
                <div style="margin:30px auto 0;padding:22px 0;border-top:1px solid rgba(178,154,104,0.42);border-bottom:1px solid rgba(178,154,104,0.32);">
                  <p style="margin:0;color:#20201e;font-size:24px;line-height:1.35;">Karsen &amp; Sarah</p>
                  <p style="margin:8px 0 0;color:#4d5948;font-size:22px;line-height:1;">07 - 17 - 27</p>
                  <p style="margin:16px 0 0;color:rgba(32,32,30,0.72);font-size:16px;line-height:1.55;">The Boathouse Restaurant &amp; Event Venue<br>Bronte Harbour · Oakville, Ontario</p>
                </div>
                <a href="${escapedSiteUrl}" style="display:inline-block;margin-top:28px;border-radius:999px;background:#4d5948;color:#fffdf7;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1;text-decoration:none;padding:15px 24px;">Visit the wedding website</a>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:rgba(32,32,30,0.52);font-family:Arial,sans-serif;font-size:12px;line-height:1.5;">You received this because your details were submitted at ${escapedSiteUrl}.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, subject, text };
}

export async function sendHouseholdConfirmationEmail(
  input: HouseholdSubmission
): Promise<SendEmailResult> {
  const email = buildConfirmationEmail(input);
  return sendEmail({
    ...email,
    to: input.primaryEmail
  });
}
