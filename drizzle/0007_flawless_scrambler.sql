CREATE TABLE `onboarding_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`applicantType` enum('agent','owner') NOT NULL,
	`status` enum('submitted','approved','changes_requested','rejected') NOT NULL DEFAULT 'submitted',
	`governmentIdUrl` text NOT NULL,
	`workProofUrl` text,
	`landTitleUrl` text,
	`occupancyRightUrl` text,
	`supportingDocumentUrl` text,
	`reviewNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationOrderId` int NOT NULL,
	`capturedByUserId` int NOT NULL,
	`kind` enum('exterior','interior','bathroom','document','other') NOT NULL,
	`mediaUrl` text NOT NULL,
	`listingMatch` enum('matches','partially_matches','does_not_match') NOT NULL,
	`observation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `onboarding_applications` ADD CONSTRAINT `onboarding_applications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboarding_applications` ADD CONSTRAINT `onboarding_applications_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_evidence` ADD CONSTRAINT `ver_evidence_order_fk` FOREIGN KEY (`verificationOrderId`) REFERENCES `verification_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_evidence` ADD CONSTRAINT `ver_evidence_user_fk` FOREIGN KEY (`capturedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `onboarding_applications_user_idx` ON `onboarding_applications` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `verification_evidence_order_idx` ON `verification_evidence` (`verificationOrderId`,`createdAt`);
