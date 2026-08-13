import { compare } from "bcryptjs";
import mysql from "mysql2/promise";

const ACCOUNTS = [
  { label: "Tarh — Seeker", email: "seeker@test.ahc.local", password: "Seeker#2026!", requiredRole: "user" },
  { label: "Ebot — Paid Agent", email: "agent@test.ahc.local", password: "Agent#2026!", requiredRole: "user", expectedSubscriptionStatus: "active", minimumListingCredits: 1 },
  { label: "Mireille — Paid Douala Agent", email: "agent-douala@test.ahc.local", password: "AgentDouala#2026!", requiredRole: "user", expectedSubscriptionStatus: "active", minimumListingCredits: 0 },
  { label: "Nadege — Pending-payment Agent", email: "agent-pending@test.ahc.local", password: "AgentPending#2026!", requiredRole: "user", expectedSubscriptionStatus: "pending_payment", minimumListingCredits: 0 },
  { label: "Ateh — New Agent applicant", email: "owner@test.ahc.local", password: "Owner#2026!", requiredRole: "user" },
  { label: "Robinson — Field Moderator", email: "moderator@test.ahc.local", password: "Moderator#2026!", requiredRole: "moderator" },
  { label: "Bryan — Admin", email: "admin@test.ahc.local", password: "Admin#2026!", requiredRole: "admin" },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const results = [];
    for (const account of ACCOUNTS) {
      const [rows] = await connection.execute(
        `SELECT u.role, u.isBanned, lc.passwordHash, ap.subscriptionStatus,
          (SELECT COUNT(*) FROM listing_credits c WHERE c.userId = u.id AND c.status = 'available' AND c.expiresAt > NOW()) AS availableCredits
        FROM users u
        JOIN local_credentials lc ON lc.userId = u.id
        LEFT JOIN agent_profiles ap ON ap.userId = u.id
        WHERE u.email = ?`,
        [account.email],
      );
      const record = rows[0];
      if (!record) throw new Error(`Missing required test account: ${account.email}`);
      const passwordMatches = await compare(account.password, record.passwordHash);
      const roleMatches = record.role === account.requiredRole;
      const subscriptionMatches = !account.expectedSubscriptionStatus || record.subscriptionStatus === account.expectedSubscriptionStatus;
      const creditsMatch = account.minimumListingCredits === undefined || Number(record.availableCredits) >= account.minimumListingCredits;
      const valid = passwordMatches && roleMatches && subscriptionMatches && creditsMatch && !record.isBanned;
      results.push({ account: account.label, email: account.email, bcryptPasswordValid: passwordMatches, role: record.role, subscription: record.subscriptionStatus ?? "n/a", availableListingCredits: Number(record.availableCredits), valid });
      if (!valid) throw new Error(`Validation failed for ${account.email}`);
    }
    console.table(results);
    console.log("All labelled non-production accounts passed credential and state validation.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Temporary AHC account validation failed:", error);
  process.exitCode = 1;
});
