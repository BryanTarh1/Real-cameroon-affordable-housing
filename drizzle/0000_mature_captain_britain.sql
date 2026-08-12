CREATE TABLE `agent_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`publicName` varchar(100) NOT NULL,
	`agencyName` varchar(120),
	`whatsappPhone` varchar(20) NOT NULL,
	`subscriptionTier` enum('free','starter','pro') NOT NULL DEFAULT 'free',
	`subscriptionStatus` enum('active','past_due','paused','expired') NOT NULL DEFAULT 'active',
	`subscriptionExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `listing_costs` (
	`listingId` varchar(32) NOT NULL,
	`monthlyRent` int NOT NULL,
	`advanceMonths` int NOT NULL DEFAULT 1,
	`securityDeposit` int NOT NULL DEFAULT 0,
	`agencyFee` int NOT NULL DEFAULT 0,
	`serviceFee` int NOT NULL DEFAULT 0,
	`firstMonthUtilities` int NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'XAF',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listing_costs_listingId` PRIMARY KEY(`listingId`)
);
--> statement-breakpoint
CREATE TABLE `listing_promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`type` enum('featured_pin') NOT NULL DEFAULT 'featured_pin',
	`status` enum('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
	`amountXaf` int NOT NULL,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`providerReference` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`city` varchar(50) NOT NULL,
	`neighborhood` varchar(100) NOT NULL,
	`landmark` text NOT NULL,
	`propertyType` varchar(50) NOT NULL,
	`householdFit` varchar(80),
	`availableFrom` date NOT NULL,
	`status` enum('draft','under_review','published','needs_reconfirmation','suspended','archived') NOT NULL DEFAULT 'under_review',
	`agentUserId` int,
	`agentNameSnapshot` varchar(100) NOT NULL,
	`lastReconfirmed` timestamp NOT NULL DEFAULT (now()),
	`freshnessWindowDays` int NOT NULL DEFAULT 14,
	`publicLatitude` decimal(10,7) NOT NULL,
	`publicLongitude` decimal(10,7) NOT NULL,
	`mapRadiusM` int NOT NULL DEFAULT 300,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`featuredUntil` timestamp,
	`verificationStatus` enum('unverified','remote_checked','physical_verified') NOT NULL DEFAULT 'unverified',
	`verificationExpiresAt` timestamp,
	`photosCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`note` text NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`filedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `verification_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`requestedByUserId` int NOT NULL,
	`assignedModeratorUserId` int,
	`status` enum('pending_payment','paid','scheduled','passed','failed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`amountXaf` int NOT NULL,
	`evidenceNote` text,
	`verifiedAt` timestamp,
	`expiresAt` timestamp,
	`providerReference` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD CONSTRAINT `agent_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_costs` ADD CONSTRAINT `listing_costs_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_promotions` ADD CONSTRAINT `listing_promotions_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_agentUserId_users_id_fk` FOREIGN KEY (`agentUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_orders` ADD CONSTRAINT `verification_orders_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_orders` ADD CONSTRAINT `verification_orders_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_orders` ADD CONSTRAINT `verification_orders_assignedModeratorUserId_users_id_fk` FOREIGN KEY (`assignedModeratorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_promotions_listing_idx` ON `listing_promotions` (`listingId`,`status`);--> statement-breakpoint
CREATE INDEX `listings_public_search_idx` ON `listings` (`status`,`city`,`lastReconfirmed`);--> statement-breakpoint
CREATE INDEX `listings_agent_idx` ON `listings` (`agentUserId`,`status`);--> statement-breakpoint
CREATE INDEX `listings_featured_idx` ON `listings` (`isFeatured`,`featuredUntil`);--> statement-breakpoint
CREATE INDEX `reports_listing_idx` ON `reports` (`listingId`,`status`);--> statement-breakpoint
CREATE INDEX `verification_orders_listing_idx` ON `verification_orders` (`listingId`,`status`);
