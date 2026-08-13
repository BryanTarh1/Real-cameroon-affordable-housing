CREATE TABLE `viewing_appointment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`action` enum('requested','confirmed','declined','cancelled_by_seeker','cancelled_by_agent','completed','no_show','expired') NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32) NOT NULL,
	`actorUserId` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `viewing_appointment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewing_appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` varchar(32) NOT NULL,
	`seekerUserId` int NOT NULL,
	`agentUserId` int NOT NULL,
	`requestedStart` timestamp NOT NULL,
	`requestedEnd` timestamp NOT NULL,
	`contactPreference` enum('whatsapp','phone') NOT NULL DEFAULT 'whatsapp',
	`privateContact` varchar(20) NOT NULL,
	`seekerNote` text,
	`agentNote` text,
	`status` enum('requested','confirmed','declined','cancelled','completed','no_show','expired') NOT NULL DEFAULT 'requested',
	`respondedAt` timestamp,
	`cancelledAt` timestamp,
	`outcomeRecordedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewing_appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `viewing_appointment_events` ADD CONSTRAINT `appt_events_appt_fk` FOREIGN KEY (`appointmentId`) REFERENCES `viewing_appointments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_appointment_events` ADD CONSTRAINT `appt_events_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD CONSTRAINT `appointments_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD CONSTRAINT `appointments_seeker_fk` FOREIGN KEY (`seekerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewing_appointments` ADD CONSTRAINT `appointments_agent_fk` FOREIGN KEY (`agentUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `viewing_appointment_events_idx` ON `viewing_appointment_events` (`appointmentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `viewing_appointments_listing_idx` ON `viewing_appointments` (`listingId`,`status`,`requestedStart`);--> statement-breakpoint
CREATE INDEX `viewing_appointments_seeker_idx` ON `viewing_appointments` (`seekerUserId`,`status`,`requestedStart`);--> statement-breakpoint
CREATE INDEX `viewing_appointments_agent_idx` ON `viewing_appointments` (`agentUserId`,`status`,`requestedStart`);
