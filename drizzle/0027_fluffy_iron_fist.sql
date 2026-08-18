CREATE TABLE `report_review_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`recipientUserId` int NOT NULL,
	`reviewedAt` timestamp NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_review_updates_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_review_updates_report_idx` UNIQUE(`reportId`)
);
--> statement-breakpoint
ALTER TABLE `admin_audit_events` MODIFY COLUMN `action` enum('settings_updated','user_banned','user_unbanned','role_changed','onboarding_reviewed','trust_report_reviewed') NOT NULL;--> statement-breakpoint
ALTER TABLE `report_review_updates` ADD CONSTRAINT `report_review_updates_reportId_reports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_review_updates` ADD CONSTRAINT `report_review_updates_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `report_review_updates_recipient_idx` ON `report_review_updates` (`recipientUserId`,`createdAt`);