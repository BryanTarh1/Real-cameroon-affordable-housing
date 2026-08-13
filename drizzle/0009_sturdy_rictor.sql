ALTER TABLE `field_verification_commissions` MODIFY COLUMN `status` enum('held','accrued','paid','voided') NOT NULL DEFAULT 'held';--> statement-breakpoint
ALTER TABLE `field_verification_commissions` ADD `evidenceReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `field_verification_commissions` ADD `evidenceReviewedByUserId` int;--> statement-breakpoint
ALTER TABLE `field_verification_commissions` ADD `evidenceReviewNote` text;--> statement-breakpoint
UPDATE `field_verification_commissions` SET `status` = 'held' WHERE `status` = 'accrued' AND `evidenceReviewedAt` IS NULL;--> statement-breakpoint
ALTER TABLE `field_verification_commissions` ADD CONSTRAINT `fv_comm_reviewed_by_fk` FOREIGN KEY (`evidenceReviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
