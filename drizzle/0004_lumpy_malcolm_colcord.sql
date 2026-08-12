CREATE TABLE `verification_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationOrderId` int NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`action` enum('assigned','scheduled','passed','failed','cancelled') NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32) NOT NULL,
	`reason` text NOT NULL,
	`actorUserId` int,
	`assignedModeratorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `verification_events` ADD CONSTRAINT `ver_evt_order_fk` FOREIGN KEY (`verificationOrderId`) REFERENCES `verification_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_events` ADD CONSTRAINT `ver_evt_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_events` ADD CONSTRAINT `ver_evt_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_events` ADD CONSTRAINT `ver_evt_assignee_fk` FOREIGN KEY (`assignedModeratorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `verification_events_order_idx` ON `verification_events` (`verificationOrderId`,`createdAt`);
