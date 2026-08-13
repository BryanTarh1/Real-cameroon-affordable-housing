import { hash } from "bcryptjs";
import mysql from "mysql2/promise";

const DEMO_DOMAIN = "@test.ahc.local";
const PASSWORDS = {
  seeker: "Seeker#2026!",
  agentPaid: "AgentPaid#2026!",
  agentPending: "AgentPending#2026!",
  owner: "Owner#2026!",
  moderator: "Moderator#2026!",
  admin: "Admin#2026!",
};

async function hashPassword(password) {
  return hash(password, 12);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function insertUser(connection, { openId, name, email, role, password }) {
  const [result] = await connection.execute(
    "INSERT INTO `users` (`openId`, `name`, `email`, `loginMethod`, `role`, `isBanned`, `lastSignedIn`) VALUES (?, ?, ?, 'ahc_local', ?, 0, NOW())",
    [openId, name, email, role],
  );
  const userId = result.insertId;
  await connection.execute(
    "INSERT INTO `local_credentials` (`userId`, `email`, `passwordHash`, `failedLoginAttempts`) VALUES (?, ?, ?, 0)",
    [userId, email, await hashPassword(password)],
  );
  return userId;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed temporary AHC test data.");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  await connection.beginTransaction();

  try {
    // Re-running this script replaces only its own clearly-labelled data.
    await connection.execute("DELETE FROM `listings` WHERE `id` LIKE 'demo-%'");
    await connection.execute("DELETE FROM `users` WHERE `email` LIKE ?", [`%${DEMO_DOMAIN}`]);

    const adminId = await insertUser(connection, {
      openId: "demo_admin_ahc_2026",
      name: "DEMO Admin — AHC Test",
      email: `admin${DEMO_DOMAIN}`,
      role: "admin",
      password: PASSWORDS.admin,
    });
    const moderatorId = await insertUser(connection, {
      openId: "demo_moderator_ahc_2026",
      name: "DEMO Field Moderator — AHC Test",
      email: `moderator${DEMO_DOMAIN}`,
      role: "moderator",
      password: PASSWORDS.moderator,
    });
    const agentId = await insertUser(connection, {
      openId: "demo_agent_ahc_2026",
      name: "DEMO Paid Agent — AHC Test",
      email: `agent-paid${DEMO_DOMAIN}`,
      role: "user",
      password: PASSWORDS.agentPaid,
    });
    const pendingAgentId = await insertUser(connection, {
      openId: "demo_agent_pending_ahc_2026",
      name: "DEMO Pending Agent — AHC Test",
      email: `agent-pending${DEMO_DOMAIN}`,
      role: "user",
      password: PASSWORDS.agentPending,
    });
    const ownerId = await insertUser(connection, {
      openId: "demo_owner_ahc_2026",
      name: "DEMO Owner Applicant — AHC Test",
      email: `owner${DEMO_DOMAIN}`,
      role: "user",
      password: PASSWORDS.owner,
    });
    const seekerId = await insertUser(connection, {
      openId: "demo_seeker_ahc_2026",
      name: "DEMO Seeker — AHC Test",
      email: `seeker${DEMO_DOMAIN}`,
      role: "user",
      password: PASSWORDS.seeker,
    });

    await connection.execute(
      "INSERT INTO `agent_profiles` (`userId`, `publicName`, `agencyName`, `whatsappPhone`, `subscriptionTier`, `subscriptionStatus`, `subscriptionExpiresAt`) VALUES (?, ?, ?, ?, 'growth', 'active', ?)",
      [agentId, "DEMO Paid Agent — AHC Test", "DEMO Test Realty", "237690000001", addDays(30)],
    );
    await connection.execute(
      "INSERT INTO `agent_profiles` (`userId`, `publicName`, `agencyName`, `whatsappPhone`, `subscriptionTier`, `subscriptionStatus`) VALUES (?, ?, ?, ?, 'access', 'pending_payment')",
      [pendingAgentId, "DEMO Pending Agent — AHC Test", "DEMO Test Realty", "237690000006"],
    );
    await connection.execute(
      "INSERT INTO `moderator_profiles` (`userId`, `displayName`, `cityCoverage`, `status`, `createdByUserId`) VALUES (?, ?, 'Yaoundé & Douala', 'active', ?)",
      [moderatorId, "DEMO Field Moderator — AHC Test", adminId],
    );
    await connection.execute(
      "INSERT INTO `onboarding_applications` (`userId`, `applicantType`, `status`, `governmentIdUrl`, `workProofUrl`, `reviewNote`, `reviewedByUserId`, `reviewedAt`) VALUES (?, 'agent', 'approved', ?, ?, 'TEST DATA: agent identity and proof-of-work reviewed and approved.', ?, NOW())",
      [agentId, "/manus-storage/ahc-test-evidence-exterior_345e18db.png", "/manus-storage/ahc-test-evidence-living-room_b47fb09f.png", adminId],
    );
    await connection.execute(
      "INSERT INTO `onboarding_applications` (`userId`, `applicantType`, `status`, `governmentIdUrl`, `landTitleUrl`, `occupancyRightUrl`, `supportingDocumentUrl`, `reviewNote`) VALUES (?, 'owner', 'submitted', ?, ?, ?, ?, 'TEST DATA: awaiting Admin review of stronger owner document package.')",
      [ownerId, "/manus-storage/ahc-test-evidence-exterior_345e18db.png", "/manus-storage/ahc-test-owner-land-title-preview_a6c75f83.png", "/manus-storage/ahc-test-evidence-living-room_b47fb09f.png", "/manus-storage/ahc-test-evidence-bathroom_bafa9958.png"],
    );
    await connection.execute(
      "INSERT INTO `platform_settings` (`id`, `agentAccessFeeXaf`, `listingPassFeeXaf`, `featuredPinFeeXaf`, `physicalVerificationFeeXaf`, `fieldModeratorShareBps`, `updatedByUserId`) VALUES (1, 3000, 1000, 3000, 7500, 8000, ?) ON DUPLICATE KEY UPDATE `updatedByUserId` = VALUES(`updatedByUserId`)",
      [adminId],
    );

    const publishedId = "demo-published-bastos";
    const reviewId = "demo-review-biyemassi";
    const changesId = "demo-changes-bonapriso";
    const listingRows = [
      [publishedId, "TEST DATA — Verified 2-bedroom near Bastos landmark", "Yaoundé", "Bastos", "Approx. 300 m from Bastos roundabout", "Apartment", "Small family", "published", agentId, "DEMO Paid Agent — AHC Test", "physical_verified", "3.8669", "11.5174", 300, 1, addDays(14), addDays(30), "TEST DATA: passed field verification", adminId],
      [reviewId, "TEST DATA — 1-bedroom awaiting moderation in Biyem-Assi", "Yaoundé", "Biyem-Assi", "Approx. 250 m from Carrefour Biyem-Assi", "Studio", "Single professional", "under_review", agentId, "DEMO Paid Agent — AHC Test", "remote_checked", "3.8424", "11.5001", 250, 0, null, null, "TEST DATA: waiting for first publication review", null],
      [changesId, "TEST DATA — Family home needing correction in Bonapriso", "Douala", "Bonapriso", "Approx. 400 m from Avenue de Gaulle", "House", "Family", "changes_requested", agentId, "DEMO Paid Agent — AHC Test", "unverified", "4.0413", "9.6985", 400, 0, null, null, "TEST DATA: clarify the advance-month cost before approval", moderatorId],
    ];
    for (const row of listingRows) {
      const [id, title, city, neighborhood, landmark, propertyType, householdFit, status, agentUserId, agentNameSnapshot, verificationStatus, latitude, longitude, mapRadiusM, isFeatured, verificationExpiresAt, featuredUntil, reviewSummary, reviewedByUserId] = row;
      await connection.execute(
        "INSERT INTO `listings` (`id`, `title`, `city`, `neighborhood`, `landmark`, `propertyType`, `householdFit`, `availableFrom`, `status`, `agentUserId`, `agentNameSnapshot`, `lastReconfirmed`, `freshnessWindowDays`, `publicLatitude`, `publicLongitude`, `mapRadiusM`, `isFeatured`, `featuredUntil`, `verificationStatus`, `verificationExpiresAt`, `photosCount`, `submittedAt`, `approvedAt`, `reviewedAt`, `reviewedByUserId`, `reviewSummary`) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, NOW(), 14, ?, ?, ?, ?, ?, ?, ?, 4, NOW(), IF(? = 'published', NOW(), NULL), IF(? IN ('published','changes_requested'), NOW(), NULL), ?, ?)",
        [id, title, city, neighborhood, landmark, propertyType, householdFit, status, agentUserId, agentNameSnapshot, latitude, longitude, mapRadiusM, isFeatured, featuredUntil, verificationStatus, verificationExpiresAt, status, status, reviewedByUserId, reviewSummary],
      );
    }

    await connection.execute(
      "INSERT INTO `listing_costs` (`listingId`, `monthlyRent`, `advanceMonths`, `securityDeposit`, `agencyFee`, `serviceFee`, `firstMonthUtilities`, `currency`) VALUES (?, 85000, 3, 85000, 85000, 15000, 10000, 'XAF'), (?, 50000, 2, 50000, 50000, 5000, 5000, 'XAF'), (?, 150000, 6, 150000, 150000, 25000, 15000, 'XAF')",
      [publishedId, reviewId, changesId],
    );
    await connection.execute(
      "INSERT INTO `listing_promotions` (`listingId`, `type`, `status`, `amountXaf`, `startsAt`, `endsAt`, `providerReference`) VALUES (?, 'featured_pin', 'active', 3000, NOW(), ?, 'TEST-PIN-2026-001')",
      [publishedId, addDays(14)],
    );

    await connection.execute(
      "INSERT INTO `payment_orders` (`id`, `userId`, `type`, `status`, `amountXaf`, `provider`, `providerReference`, `submittedAt`, `reconciledAt`, `reconciledByUserId`, `reconciliationNote`, `expiresAt`) VALUES ('demo-agent-access-confirmed', ?, 'agent_access', 'confirmed', 3000, 'mtn_momo', 'TEST-MOMO-ACCESS-001', NOW(), NOW(), ?, 'TEST DATA: confirmed for agent-access workflow.', ?)",
      [agentId, adminId, addDays(30)],
    );
    await connection.execute(
      "INSERT INTO `payment_orders` (`id`, `userId`, `type`, `status`, `amountXaf`, `provider`, `providerReference`, `submittedAt`, `reconciledAt`, `reconciledByUserId`, `reconciliationNote`, `expiresAt`) VALUES ('demo-listing-pass-confirmed', ?, 'listing_pass', 'confirmed', 1000, 'orange_money', 'TEST-OM-PASS-001', NOW(), NOW(), ?, 'TEST DATA: confirmed listing credit.', ?)",
      [agentId, adminId, addDays(90)],
    );
    await connection.execute(
      "INSERT INTO `payment_orders` (`id`, `userId`, `type`, `status`, `amountXaf`, `provider`, `providerReference`, `submittedAt`, `reconciliationNote`, `expiresAt`) VALUES ('demo-payment-awaiting-review', ?, 'physical_verification', 'reference_submitted', 7500, 'mtn_momo', 'TEST-MOMO-VERIFY-001', NOW(), 'TEST DATA: awaiting Field Moderator reconciliation.', ?)",
      [agentId, addDays(7)],
    );
    await connection.execute(
      "INSERT INTO `payment_orders` (`id`, `userId`, `listingId`, `type`, `status`, `amountXaf`, `provider`, `providerReference`, `submittedAt`, `reconciledAt`, `reconciledByUserId`, `reconciliationNote`, `expiresAt`) VALUES ('demo-verify-confirmed', ?, ?, 'physical_verification', 'confirmed', 7500, 'mtn_momo', 'TEST-MOMO-VERIFY-002', NOW(), NOW(), ?, 'TEST DATA: confirmed field verification payment.', ?)",
      [agentId, publishedId, adminId, addDays(30)],
    );
    await connection.execute(
      "INSERT INTO `listing_credits` (`userId`, `paymentOrderId`, `status`, `expiresAt`) VALUES (?, 'demo-listing-pass-confirmed', 'available', ?)",
      [agentId, addDays(90)],
    );

    const reviewEvents = [
      [publishedId, "submitted", "draft", "under_review", "TEST DATA: listing submitted for first publication.", agentId, null],
      [publishedId, "approved", "under_review", "published", "TEST DATA: public cost fields and landmark privacy checked.", moderatorId, moderatorId],
      [reviewId, "submitted", "draft", "under_review", "TEST DATA: listing submitted for review.", agentId, null],
      [reviewId, "assigned", "under_review", "under_review", "TEST DATA: assigned to Field Moderator.", moderatorId, moderatorId],
      [changesId, "submitted", "draft", "under_review", "TEST DATA: listing submitted for review.", agentId, null],
      [changesId, "changes_requested", "under_review", "changes_requested", "TEST DATA: advance cost needs clarification.", moderatorId, moderatorId],
    ];
    for (const event of reviewEvents) {
      await connection.execute(
        "INSERT INTO `listing_review_events` (`listingId`, `action`, `fromStatus`, `toStatus`, `reason`, `actorUserId`, `assignedModeratorUserId`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        event,
      );
    }

    const [verificationResult] = await connection.execute(
      "INSERT INTO `verification_orders` (`listingId`, `requestedByUserId`, `assignedModeratorUserId`, `status`, `amountXaf`, `evidenceNote`, `verifiedAt`, `expiresAt`, `providerReference`) VALUES (?, ?, ?, 'passed', 7500, 'TEST DATA: landmark, availability, and cost disclosure checked during field visit.', NOW(), ?, 'TEST-MOMO-VERIFY-002')",
      [publishedId, agentId, moderatorId, addDays(30)],
    );
    const verificationOrderId = verificationResult.insertId;
    const verificationEvidence = [
      ["exterior", "/manus-storage/ahc-test-evidence-exterior_345e18db.png", "matches", "TEST DATA: exterior landmark orientation and facade match the public listing images."],
      ["interior", "/manus-storage/ahc-test-evidence-living-room_b47fb09f.png", "matches", "TEST DATA: living room layout and stated two-bedroom configuration observed during the visit."],
      ["bathroom", "/manus-storage/ahc-test-evidence-bathroom_bafa9958.png", "partially_matches", "TEST DATA: bathroom is usable; tile finish differs slightly from the earlier listing photo and was recorded."],
    ];
    for (const [kind, mediaUrl, listingMatch, observation] of verificationEvidence) {
      await connection.execute(
        "INSERT INTO `verification_evidence` (`verificationOrderId`, `capturedByUserId`, `kind`, `mediaUrl`, `listingMatch`, `observation`) VALUES (?, ?, ?, ?, ?, ?)",
        [verificationOrderId, moderatorId, kind, mediaUrl, listingMatch, observation],
      );
    }
    await connection.execute(
      "INSERT INTO `verification_events` (`verificationOrderId`, `listingId`, `action`, `fromStatus`, `toStatus`, `reason`, `actorUserId`, `assignedModeratorUserId`) VALUES (?, ?, 'assigned', 'paid', 'scheduled', 'TEST DATA: field visit assigned.', ?, ?)",
      [verificationOrderId, publishedId, moderatorId, moderatorId],
    );
    await connection.execute(
      "INSERT INTO `verification_events` (`verificationOrderId`, `listingId`, `action`, `fromStatus`, `toStatus`, `reason`, `actorUserId`, `assignedModeratorUserId`) VALUES (?, ?, 'passed', 'scheduled', 'passed', 'TEST DATA: field visit passed.', ?, ?)",
      [verificationOrderId, publishedId, moderatorId, moderatorId],
    );
    await connection.execute(
      "INSERT INTO `field_verification_commissions` (`verificationOrderId`, `moderatorUserId`, `grossAmountXaf`, `fieldModeratorAmountXaf`, `platformAmountXaf`, `fieldModeratorShareBps`, `status`) VALUES (?, ?, 7500, 6000, 1500, 8000, 'accrued')",
      [verificationOrderId, moderatorId],
    );
    await connection.execute(
      "INSERT INTO `admin_audit_events` (`action`, `actorUserId`, `targetUserId`, `details`) VALUES ('role_changed', ?, ?, 'TEST DATA: temporary Field Moderator authority assigned.')",
      [adminId, moderatorId],
    );
    await connection.execute(
      "INSERT INTO `admin_audit_events` (`action`, `actorUserId`, `targetUserId`, `details`) VALUES ('role_changed', ?, ?, 'TEST DATA: temporary Admin authority assigned.')",
      [adminId, adminId],
    );

    await connection.commit();
    console.table([
      { role: "Seeker", email: `seeker${DEMO_DOMAIN}`, password: PASSWORDS.seeker },
      { role: "Paid Agent", email: `agent-paid${DEMO_DOMAIN}`, password: PASSWORDS.agentPaid },
      { role: "Pending-payment Agent", email: `agent-pending${DEMO_DOMAIN}`, password: PASSWORDS.agentPending },
      { role: "Owner applicant", email: `owner${DEMO_DOMAIN}`, password: PASSWORDS.owner },
      { role: "Field Moderator", email: `moderator${DEMO_DOMAIN}`, password: PASSWORDS.moderator },
      { role: "Admin", email: `admin${DEMO_DOMAIN}`, password: PASSWORDS.admin },
    ]);
    console.log("Temporary AHC test data created. Delete users ending in @test.ahc.local to remove it.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Temporary test-data seed failed:", error);
  process.exitCode = 1;
});
