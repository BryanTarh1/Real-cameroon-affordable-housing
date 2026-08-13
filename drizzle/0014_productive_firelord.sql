CREATE TABLE `listing_neighborhood_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`verificationOrderId` int NOT NULL,
	`assessedByUserId` int NOT NULL,
	`waterAccess` enum('borehole_on_site','water_storage_seen','public_network_observed','not_confirmed') NOT NULL DEFAULT 'not_confirmed',
	`powerReliability` enum('backup_seen','prepaid_meter_seen','local_low_outage_assessment','local_outage_caution','not_confirmed') NOT NULL DEFAULT 'not_confirmed',
	`roadAccess` enum('tarred_to_gate','tarred_nearby','dirt_track_to_gate','not_confirmed') NOT NULL DEFAULT 'not_confirmed',
	`taxiWalkMinutes` int,
	`junctionName` varchar(100),
	`junctionMinutes` int,
	`observationNote` text NOT NULL,
	`assessedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_neighborhood_assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `listing_neighborhood_assessments_listingId_unique` UNIQUE(`listingId`),
	CONSTRAINT `listing_neighborhood_assessments_verificationOrderId_unique` UNIQUE(`verificationOrderId`)
);
--> statement-breakpoint
CREATE TABLE `listing_walkthrough_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`verificationOrderId` int NOT NULL,
	`capturedByUserId` int NOT NULL,
	`storageKey` text NOT NULL,
	`mediaUrl` text NOT NULL,
	`durationSeconds` int NOT NULL,
	`orientation` enum('vertical','other') NOT NULL DEFAULT 'vertical',
	`listingMatch` enum('matches','partially_matches','does_not_match') NOT NULL,
	`status` enum('captured','published','withheld') NOT NULL DEFAULT 'captured',
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	CONSTRAINT `listing_walkthrough_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `listing_walkthrough_videos_listingId_unique` UNIQUE(`listingId`),
	CONSTRAINT `listing_walkthrough_videos_verificationOrderId_unique` UNIQUE(`verificationOrderId`)
);
--> statement-breakpoint
CREATE TABLE `match_alert_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`preferenceId` int NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`recipientUserId` int NOT NULL,
	`status` enum('provider_pending','queued','sent','delivered','read','failed','suppressed') NOT NULL DEFAULT 'provider_pending',
	`provider` varchar(64) NOT NULL DEFAULT 'unconfigured',
	`providerMessageId` varchar(160),
	`suppressionReason` text,
	`queuedAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`failedAt` timestamp,
	CONSTRAINT `match_alert_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `match_alert_deliveries_preference_listing_idx` UNIQUE(`preferenceId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `seeker_match_alert_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`whatsappPhone` varchar(20) NOT NULL,
	`city` varchar(50) NOT NULL,
	`neighborhood` varchar(100),
	`minBedrooms` int NOT NULL DEFAULT 0,
	`maxMonthlyRent` int,
	`maxMoveInCash` int,
	`active` boolean NOT NULL DEFAULT true,
	`consentVersion` varchar(32) NOT NULL DEFAULT '2026-08-13',
	`consentedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seeker_match_alert_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `listings` ADD `bedrooms` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `listing_neighborhood_assessments` ADD CONSTRAINT `lna_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_neighborhood_assessments` ADD CONSTRAINT `lna_order_fk` FOREIGN KEY (`verificationOrderId`) REFERENCES `verification_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_neighborhood_assessments` ADD CONSTRAINT `lna_staff_fk` FOREIGN KEY (`assessedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_walkthrough_videos` ADD CONSTRAINT `lwv_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_walkthrough_videos` ADD CONSTRAINT `lwv_order_fk` FOREIGN KEY (`verificationOrderId`) REFERENCES `verification_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_walkthrough_videos` ADD CONSTRAINT `lwv_staff_fk` FOREIGN KEY (`capturedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_alert_deliveries` ADD CONSTRAINT `mad_preference_fk` FOREIGN KEY (`preferenceId`) REFERENCES `seeker_match_alert_preferences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_alert_deliveries` ADD CONSTRAINT `mad_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_alert_deliveries` ADD CONSTRAINT `mad_recipient_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seeker_match_alert_preferences` ADD CONSTRAINT `smap_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_neighborhood_assessments_listing_idx` ON `listing_neighborhood_assessments` (`listingId`);--> statement-breakpoint
CREATE INDEX `listing_walkthroughs_public_idx` ON `listing_walkthrough_videos` (`status`,`listingId`);--> statement-breakpoint
CREATE INDEX `match_alert_deliveries_status_idx` ON `match_alert_deliveries` (`status`,`queuedAt`);--> statement-breakpoint
CREATE INDEX `match_alert_deliveries_user_idx` ON `match_alert_deliveries` (`recipientUserId`,`queuedAt`);--> statement-breakpoint
CREATE INDEX `seeker_match_alert_preferences_user_idx` ON `seeker_match_alert_preferences` (`userId`,`active`);
