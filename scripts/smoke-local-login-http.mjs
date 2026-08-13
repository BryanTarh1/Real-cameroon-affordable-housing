const baseUrl = process.env.AHC_BASE_URL ?? "http://localhost:3000";

const accounts = [
  { label: "Paid Agent", email: "agent@test.ahc.local", password: "Agent#2026!", expectedRole: "user" },
  { label: "Field Moderator", email: "moderator@test.ahc.local", password: "Moderator#2026!", expectedRole: "moderator" },
  { label: "Admin", email: "admin@test.ahc.local", password: "Admin#2026!", expectedRole: "admin" },
];

function trpcBody(input) {
  return JSON.stringify({ json: input });
}

async function loginAndVerify(account) {
  const loginResponse = await fetch(`${baseUrl}/api/trpc/auth.loginLocalAgent?batch=1`, {
    method: "POST",
    headers: { "content-type": "application/json", "trpc-accept": "application/json" },
    body: JSON.stringify({ "0": { json: { email: account.email, password: account.password } } }),
  });
  const loginPayload = await loginResponse.json();
  const cookies = typeof loginResponse.headers.getSetCookie === "function" ? loginResponse.headers.getSetCookie() : [loginResponse.headers.get("set-cookie")].filter(Boolean);
  const sessionCookie = cookies.find(cookie => cookie.startsWith("ahc_local_session="));
  if (!loginResponse.ok || loginPayload[0]?.error || !sessionCookie) {
    throw new Error(`${account.label} login failed: ${JSON.stringify(loginPayload)}`);
  }

  const cookieHeader = sessionCookie.split(";")[0];
  const meResponse = await fetch(`${baseUrl}/api/trpc/auth.me?input=${encodeURIComponent(trpcBody(null))}`, {
    headers: { cookie: cookieHeader, "trpc-accept": "application/json" },
  });
  const mePayload = await meResponse.json();
  const user = mePayload?.result?.data?.json;
  if (!meResponse.ok || user?.email !== account.email || user?.role !== account.expectedRole) {
    throw new Error(`${account.label} session verification failed: ${JSON.stringify(mePayload)}`);
  }
  return { account: account.label, email: user.email, role: user.role, httpLogin: "passed", sessionCookie: "issued" };
}

async function main() {
  const results = [];
  for (const account of accounts) results.push(await loginAndVerify(account));
  console.table(results);
  console.log("Browser-equivalent local login and session checks passed.");
}

main().catch(error => {
  console.error("AHC local login HTTP smoke test failed:", error);
  process.exitCode = 1;
});
