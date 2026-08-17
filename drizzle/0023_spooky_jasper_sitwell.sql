CREATE TABLE `duplicate_listing_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`candidateListingId` varchar(32) NOT NULL,
	`confidenceScore` int NOT NULL,
	`signalSummary` varchar(500) NOT NULL,
	`status` enum('open','dismissed','confirmed_duplicate') NOT NULL DEFAULT 'open',
	`reviewedByUserId` int,
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `duplicate_listing_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `duplicate_listing_pair_idx` UNIQUE(`listingId`,`candidateListingId`)
);
--> statement-breakpoint
CREATE TABLE `listing_price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`previousMonthlyRent` int NOT NULL,
	`previousAdvanceMonths` int NOT NULL,
	`previousSecurityDeposit` int NOT NULL,
	`previousAgencyFee` int NOT NULL,
	`previousServiceFee` int NOT NULL,
	`previousFirstMonthUtilities` int NOT NULL,
	`monthlyRent` int NOT NULL,
	`advanceMonths` int NOT NULL,
	`securityDeposit` int NOT NULL,
	`agencyFee` int NOT NULL,
	`serviceFee` int NOT NULL,
	`firstMonthUtilities` int NOT NULL,
	`changeReason` varchar(500) NOT NULL,
	`changedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewing_appointment_seeker_outcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`seekerUserId` int NOT NULL,
	`outcome` enum('matched_listing','price_differed','already_rented','did_not_attend') NOT NULL,
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `viewing_appointment_seeker_outcomes_id` PRIMARY KEY(`id`),
	CONSTRAINT `viewing_appointment_seeker_outcomes_appointmentId_unique` UNIQUE(`appointmentId`)
);
--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD `availabilityStatus` enum('pending','confirmed','expired') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD `availabilityConfirmationDueAt` timestamp;--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD `availabilityConfirmedAt` timestamp;--> statement-breakpoint
UPDATE `viewing_appointments` SET `availabilityStatus` = 'confirmed', `availabilityConfirmationDueAt` = DATE_ADD(`createdAt`, INTERVAL 48 HOUR), `availabilityConfirmedAt` = `createdAt`;--> statement-breakpoint
ALTER TABLE `viewing_appointments` MODIFY `availabilityConfirmationDueAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `duplicate_listing_reviews` ADD CONSTRAINT `duplicate_listing_reviews_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `duplicate_listing_reviews` ADD CONSTRAINT `duplicate_listing_reviews_candidateListingId_listings_id_fk` FOREIGN KEY (`candidateListingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `duplicate_listing_reviews` ADD CONSTRAINT `duplicate_listing_reviews_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_price_history` ADD CONSTRAINT `listing_price_history_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_price_history` ADD CONSTRAINT `listing_price_history_changedByUserId_users_id_fk` FOREIGN KEY (`changedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_appointment_seeker_outcomes` ADD CONSTRAINT `viewing_outcomes_appointment_fk` FOREIGN KEY (`appointmentId`) REFERENCES `viewing_appointments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_appointment_seeker_outcomes` ADD CONSTRAINT `viewing_outcomes_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_appointment_seeker_outcomes` ADD CONSTRAINT `viewing_outcomes_seeker_fk` FOREIGN KEY (`seekerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `duplicate_listing_review_queue_idx` ON `duplicate_listing_reviews` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `listing_price_history_listing_idx` ON `listing_price_history` (`listingId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `viewing_outcomes_listing_idx` ON `viewing_appointment_seeker_outcomes` (`listingId`,`outcome`,`createdAt`);--> statement-breakpoint
CREATE INDEX `viewing_outcomes_seeker_idx` ON `viewing_appointment_seeker_outcomes` (`seekerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `viewing_appointments_availability_idx` ON `viewing_appointments` (`availabilityStatus`,`availabilityConfirmationDueAt`);
