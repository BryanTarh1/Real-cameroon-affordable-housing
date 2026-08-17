CREATE TABLE `listing_view_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seekerUserId` int NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`viewCount` int NOT NULL DEFAULT 1,
	`firstViewedAt` timestamp NOT NULL DEFAULT (now()),
	`lastViewedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listing_view_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `listing_view_history_seeker_listing_idx` UNIQUE(`seekerUserId`,`listingId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `profileImageStorageKey` text;--> statement-breakpoint
ALTER TABLE `users` ADD `emailAccountUpdatesEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailMatchAlertsEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `listing_view_history` ADD CONSTRAINT `listing_view_history_seekerUserId_users_id_fk` FOREIGN KEY (`seekerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_view_history` ADD CONSTRAINT `listing_view_history_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_view_history_seeker_recent_idx` ON `listing_view_history` (`seekerUserId`,`lastViewedAt`);