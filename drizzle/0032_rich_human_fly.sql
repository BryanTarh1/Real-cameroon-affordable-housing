CREATE TABLE `listing_illustrative_test_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`mediaUrl` text NOT NULL,
	`kind` enum('exterior','interior','bathroom','other') NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_illustrative_test_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `listings` ADD `isTestData` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `listing_illustrative_test_media` ADD CONSTRAINT `listing_illustrative_test_media_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_illustrative_test_media_listing_order_idx` ON `listing_illustrative_test_media` (`listingId`,`displayOrder`);