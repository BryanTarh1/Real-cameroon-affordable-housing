CREATE TABLE `lead_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`seekerUserId` int NOT NULL,
	`contactUserId` int,
	`channel` enum('whatsapp') NOT NULL DEFAULT 'whatsapp',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reports` ADD `reporterUserId` int;--> statement-breakpoint
ALTER TABLE `reports` ADD `reason` enum('inaccurate_cost','unavailable','misleading_details','other') DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_distinct_reporter_idx` UNIQUE(`listingId`,`reporterUserId`);--> statement-breakpoint
ALTER TABLE `lead_events` ADD CONSTRAINT `lead_events_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_events` ADD CONSTRAINT `lead_events_seekerUserId_users_id_fk` FOREIGN KEY (`seekerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_events` ADD CONSTRAINT `lead_events_contactUserId_users_id_fk` FOREIGN KEY (`contactUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lead_events_listing_idx` ON `lead_events` (`listingId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `lead_events_contact_idx` ON `lead_events` (`contactUserId`,`createdAt`);--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterUserId_users_id_fk` FOREIGN KEY (`reporterUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;