CREATE TABLE `listing_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paymentOrderId` varchar(32),
	`status` enum('available','consumed','restored','expired') NOT NULL DEFAULT 'available',
	`usedForListingId` varchar(32),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`consumedAt` timestamp,
	CONSTRAINT `listing_credits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listing_review_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`action` enum('submitted','assigned','approved','changes_requested','rejected','resubmitted','suspended','archived') NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32) NOT NULL,
	`reason` text,
	`actorUserId` int,
	`assignedModeratorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_review_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderator_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moderator_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `moderator_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `payment_orders` (
	`id` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`listingId` varchar(32),
	`type` enum('agent_access','listing_pass','featured_pin','physical_verification') NOT NULL,
	`status` enum('awaiting_reference','reference_submitted','confirmed','rejected','expired','cancelled') NOT NULL DEFAULT 'awaiting_reference',
	`amountXaf` int NOT NULL,
	`provider` enum('mtn_momo','orange_money','other') NOT NULL DEFAULT 'mtn_momo',
	`providerReference` varchar(120),
	`submittedAt` timestamp,
	`reconciledAt` timestamp,
	`reconciledByUserId` int,
	`reconciliationNote` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_profiles` MODIFY COLUMN `subscriptionTier` enum('free','starter','pro','access','growth','agency') NOT NULL DEFAULT 'access';--> statement-breakpoint
ALTER TABLE `agent_profiles` MODIFY COLUMN `subscriptionStatus` enum('pending_payment','active','past_due','paused','suspended','expired') NOT NULL DEFAULT 'pending_payment';--> statement-breakpoint
UPDATE `agent_profiles` SET
  `subscriptionTier` = CASE `subscriptionTier`
    WHEN 'free' THEN 'access'
    WHEN 'starter' THEN 'growth'
    WHEN 'pro' THEN 'agency'
    ELSE `subscriptionTier`
  END,
  `subscriptionStatus` = CASE WHEN `subscriptionTier` = 'free' THEN 'pending_payment' ELSE `subscriptionStatus` END;--> statement-breakpoint
ALTER TABLE `agent_profiles` MODIFY COLUMN `subscriptionTier` enum('access','growth','agency') NOT NULL DEFAULT 'access';--> statement-breakpoint
ALTER TABLE `agent_profiles` MODIFY COLUMN `subscriptionStatus` enum('pending_payment','active','past_due','suspended','expired') NOT NULL DEFAULT 'pending_payment';--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `status` enum('draft','under_review','changes_requested','rejected','published','needs_reconfirmation','suspended','archived') NOT NULL DEFAULT 'under_review';--> statement-breakpoint
ALTER TABLE `listings` ADD `submittedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `listings` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `listings` ADD `reviewedByUserId` int;--> statement-breakpoint
ALTER TABLE `listings` ADD `reviewSummary` text;--> statement-breakpoint
ALTER TABLE `listing_credits` ADD CONSTRAINT `listing_credits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_credits` ADD CONSTRAINT `listing_credits_paymentOrderId_payment_orders_id_fk` FOREIGN KEY (`paymentOrderId`) REFERENCES `payment_orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_credits` ADD CONSTRAINT `listing_credits_usedForListingId_listings_id_fk` FOREIGN KEY (`usedForListingId`) REFERENCES `listings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_review_events` ADD CONSTRAINT `listing_review_events_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_review_events` ADD CONSTRAINT `listing_review_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_review_events` ADD CONSTRAINT `listing_review_events_assignedModeratorUserId_users_id_fk` FOREIGN KEY (`assignedModeratorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderator_profiles` ADD CONSTRAINT `moderator_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderator_profiles` ADD CONSTRAINT `moderator_profiles_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_reconciledByUserId_users_id_fk` FOREIGN KEY (`reconciledByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_credits_user_idx` ON `listing_credits` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `listing_review_events_queue_idx` ON `listing_review_events` (`listingId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `payment_orders_queue_idx` ON `payment_orders` (`status`,`type`,`createdAt`);--> statement-breakpoint
CREATE INDEX `payment_orders_user_idx` ON `payment_orders` (`userId`,`status`);--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
