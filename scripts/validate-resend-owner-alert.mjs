const required = ["RESEND_API_KEY", "OWNER_ALERT_EMAIL", "RESEND_FROM_EMAIL"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required for this live validation.`);
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
    "Idempotency-Key": "ahc-owner-alert/email-fallback-activation-check-v1",
  },
  body: JSON.stringify({
    from: process.env.RESEND_FROM_EMAIL,
    to: [process.env.OWNER_ALERT_EMAIL],
    subject: "AHC owner email alerts activated",
    text: [
      "Affordable Housing Cameroon owner alert",
      "Event: AHC email fallback activation check",
      "Reference: EMAIL-FALLBACK-ACTIVATION-CHECK",
      "Review: https://affordableho-8aahm5dj.manus.space/admin",
      "This operational message contains no renter or property private data.",
    ].join("\n"),
  }),
  signal: AbortSignal.timeout(12_000),
});

const body = await response.json().catch(() => null);
if (!response.ok || !body?.id) {
  throw new Error(`Resend validation request failed: ${body?.message ?? response.status}`);
}

console.log(JSON.stringify({ accepted: true, providerMessageId: body.id }));
