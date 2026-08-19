CREATE TABLE `listing_public_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`verificationEvidenceId` int NOT NULL,
	`mediaUrl` text NOT NULL,
	`kind` enum('exterior','interior','bathroom','other') NOT NULL,
	`provenance` enum('moderator_captured','moderator_captured_test_data') NOT NULL DEFAULT 'moderator_captured',
	`displayOrder` int NOT NULL DEFAULT 0,
	`approvedByUserId` int,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_public_media_id` PRIMARY KEY(`id`),
	CONSTRAINT `listing_public_media_evidence_idx` UNIQUE(`verificationEvidenceId`)
);
--> statement-breakpoint
ALTER TABLE `listing_public_media` ADD CONSTRAINT `lpm_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_public_media` ADD CONSTRAINT `lpm_evidence_fk` FOREIGN KEY (`verificationEvidenceId`) REFERENCES `verification_evidence`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_public_media` ADD CONSTRAINT `lpm_approver_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_public_media_listing_order_idx` ON `listing_public_media` (`listingId`,`displayOrder`);
