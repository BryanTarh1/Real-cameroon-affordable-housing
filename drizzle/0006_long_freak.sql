CREATE TABLE `local_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`failedLoginAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastPasswordChangedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `local_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_credentials_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `local_credentials_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `local_credentials` ADD CONSTRAINT `local_credentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `local_credentials_locked_idx` ON `local_credentials` (`lockedUntil`);