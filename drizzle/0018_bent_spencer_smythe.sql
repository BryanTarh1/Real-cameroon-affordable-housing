CREATE TABLE `owner_alert_outbox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('payment_confirmed','payment_rejected','verification_passed','verification_failed','safety_hold_applied','safety_hold_released','listing_published','announcement') NOT NULL,
	`referenceId` varchar(96) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`dedupeKey` varchar(180) NOT NULL,
	`status` enum('queued','sent','delivered','read','failed','suppressed') NOT NULL DEFAULT 'queued',
	`provider` varchar(64) NOT NULL DEFAULT 'unconfigured',
	`providerMessageId` varchar(160),
	`attemptCount` int NOT NULL DEFAULT 0,
	`failureReason` text,
	`queuedAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`failedAt` timestamp,
	CONSTRAINT `owner_alert_outbox_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_alert_outbox_dedupe_idx` UNIQUE(`dedupeKey`),
	CONSTRAINT `owner_alert_outbox_provider_message_idx` UNIQUE(`providerMessageId`)
);
--> statement-breakpoint
CREATE INDEX `owner_alert_outbox_status_idx` ON `owner_alert_outbox` (`status`,`queuedAt`);