CREATE TABLE `verification_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationOrderId` int NOT NULL,
	`primaryModeratorUserId` int NOT NULL,
	`auditorUserId` int,
	`status` enum('selected','claimed','confirmed','disputed','cancelled') NOT NULL DEFAULT 'selected',
	`listingMatch` enum('matches','partially_matches','does_not_match'),
	`exteriorProofUrl` text,
	`supportingProofUrl` text,
	`observation` text,
	`selectedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `verification_audits_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_audits_verificationOrderId_unique` UNIQUE(`verificationOrderId`)
);
--> statement-breakpoint
ALTER TABLE `verification_audits` ADD CONSTRAINT `ver_audits_order_fk` FOREIGN KEY (`verificationOrderId`) REFERENCES `verification_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_audits` ADD CONSTRAINT `ver_audits_primary_mod_fk` FOREIGN KEY (`primaryModeratorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_audits` ADD CONSTRAINT `ver_audits_auditor_fk` FOREIGN KEY (`auditorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `verification_audits_status_idx` ON `verification_audits` (`status`,`selectedAt`);--> statement-breakpoint
CREATE INDEX `verification_audits_auditor_idx` ON `verification_audits` (`auditorUserId`,`status`);
