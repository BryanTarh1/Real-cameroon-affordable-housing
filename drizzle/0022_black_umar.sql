CREATE TABLE `saved_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seekerUserId` int NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_listings_seeker_listing_idx` UNIQUE(`seekerUserId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `viewing_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`agentUserId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('open','reserved','cancelled','expired') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewing_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD `slotId` int;--> statement-breakpoint
ALTER TABLE `saved_listings` ADD CONSTRAINT `saved_listings_seekerUserId_users_id_fk` FOREIGN KEY (`seekerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_listings` ADD CONSTRAINT `saved_listings_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_slots` ADD CONSTRAINT `viewing_slots_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_slots` ADD CONSTRAINT `viewing_slots_agentUserId_users_id_fk` FOREIGN KEY (`agentUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `saved_listings_seeker_created_idx` ON `saved_listings` (`seekerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `viewing_slots_listing_idx` ON `viewing_slots` (`listingId`,`status`,`startsAt`);--> statement-breakpoint
CREATE INDEX `viewing_slots_agent_idx` ON `viewing_slots` (`agentUserId`,`status`,`startsAt`);--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD CONSTRAINT `viewing_appointments_slotId_viewing_slots_id_fk` FOREIGN KEY (`slotId`) REFERENCES `viewing_slots`(`id`) ON DELETE set null ON UPDATE no action;