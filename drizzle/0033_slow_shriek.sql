CREATE TABLE `agent_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`confirmedPurchaseId` int NOT NULL,
	`reviewerUserId` int NOT NULL,
	`agentUserId` int NOT NULL,
	`reviewText` varchar(500) NOT NULL,
	`moderationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`moderationNote` varchar(500),
	`moderatedByAdminUserId` int,
	`moderatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_reviews_confirmedPurchaseId_unique` UNIQUE(`confirmedPurchaseId`)
);
--> statement-breakpoint
CREATE TABLE `confirmed_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`seekerUserId` int NOT NULL,
	`agentUserId` int NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`confirmedByAdminUserId` int NOT NULL,
	`note` varchar(500),
	`confirmedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `confirmed_purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `confirmed_purchases_appointmentId_unique` UNIQUE(`appointmentId`)
);
--> statement-breakpoint
ALTER TABLE `admin_audit_events` MODIFY COLUMN `action` enum('settings_updated','user_banned','user_unbanned','role_changed','onboarding_reviewed','trust_report_reviewed','purchase_confirmed','agent_review_moderated') NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD CONSTRAINT `agent_reviews_confirmedPurchaseId_confirmed_purchases_id_fk` FOREIGN KEY (`confirmedPurchaseId`) REFERENCES `confirmed_purchases`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD CONSTRAINT `agent_reviews_reviewerUserId_users_id_fk` FOREIGN KEY (`reviewerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD CONSTRAINT `agent_reviews_agentUserId_users_id_fk` FOREIGN KEY (`agentUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD CONSTRAINT `agent_reviews_moderatedByAdminUserId_users_id_fk` FOREIGN KEY (`moderatedByAdminUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `confirmed_purchases` ADD CONSTRAINT `confirmed_purchases_appointmentId_viewing_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `viewing_appointments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `confirmed_purchases` ADD CONSTRAINT `confirmed_purchases_seekerUserId_users_id_fk` FOREIGN KEY (`seekerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `confirmed_purchases` ADD CONSTRAINT `confirmed_purchases_agentUserId_users_id_fk` FOREIGN KEY (`agentUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `confirmed_purchases` ADD CONSTRAINT `confirmed_purchases_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `confirmed_purchases` ADD CONSTRAINT `confirmed_purchases_confirmedByAdminUserId_users_id_fk` FOREIGN KEY (`confirmedByAdminUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `agent_reviews_public_idx` ON `agent_reviews` (`agentUserId`,`moderationStatus`,`createdAt`);--> statement-breakpoint
CREATE INDEX `agent_reviews_reviewer_idx` ON `agent_reviews` (`reviewerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `agent_reviews_moderation_queue_idx` ON `agent_reviews` (`moderationStatus`,`createdAt`);--> statement-breakpoint
CREATE INDEX `confirmed_purchases_seeker_idx` ON `confirmed_purchases` (`seekerUserId`,`confirmedAt`);--> statement-breakpoint
CREATE INDEX `confirmed_purchases_agent_idx` ON `confirmed_purchases` (`agentUserId`,`confirmedAt`);--> statement-breakpoint
CREATE INDEX `confirmed_purchases_listing_idx` ON `confirmed_purchases` (`listingId`,`confirmedAt`);