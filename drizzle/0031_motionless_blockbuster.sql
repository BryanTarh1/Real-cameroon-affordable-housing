ALTER TABLE `listings` ADD `description` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `bathrooms` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `parkingSpaces` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `amenities` varchar(500);