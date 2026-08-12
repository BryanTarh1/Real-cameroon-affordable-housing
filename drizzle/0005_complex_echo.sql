CREATE TABLE `admin_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('settings_updated','user_banned','user_unbanned','role_changed') NOT NULL,
	`actorUserId` int NOT NULL,
	`targetUserId` int,
	`details` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_verification_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationOrderId` int NOT NULL,
	`moderatorUserId` int NOT NULL,
	`grossAmountXaf` int NOT NULL,
	`fieldModeratorAmountXaf` int NOT NULL,
	`platformAmountXaf` int NOT NULL,
	`fieldModeratorShareBps` int NOT NULL,
	`status` enum('accrued','paid','voided') NOT NULL DEFAULT 'accrued',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `field_verification_commissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `field_verification_commissions_verificationOrderId_unique` UNIQUE(`verificationOrderId`)
);
--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`id` int NOT NULL,
	`agentAccessFeeXaf` int NOT NULL DEFAULT 3000,
	`listingPassFeeXaf` int NOT NULL DEFAULT 1000,
	`featuredPinFeeXaf` int NOT NULL DEFAULT 3000,
	`physicalVerificationFeeXaf` int NOT NULL DEFAULT 7500,
	`fieldModeratorShareBps` int NOT NULL DEFAULT 8000,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `moderator_profiles` ADD `cityCoverage` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bannedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `bannedByUserId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `banReason` text;--> statement-breakpoint
ALTER TABLE `admin_audit_events` ADD CONSTRAINT `admin_audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_audit_events` ADD CONSTRAINT `admin_audit_events_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `field_verification_commissions` ADD CONSTRAINT `fvc_order_fk` FOREIGN KEY (`verificationOrderId`) REFERENCES `verification_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `field_verification_commissions` ADD CONSTRAINT `fvc_moderator_fk` FOREIGN KEY (`moderatorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD CONSTRAINT `platform_settings_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_audit_events_created_idx` ON `admin_audit_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `field_verification_commissions_moderator_idx` ON `field_verification_commissions` (`moderatorUserId`,`status`);
