ALTER TABLE `onboarding_applications` MODIFY COLUMN `governmentIdUrl` text;--> statement-breakpoint
ALTER TABLE `onboarding_applications` ADD `taxpayerNumber` varchar(80);--> statement-breakpoint
ALTER TABLE `onboarding_applications` ADD `governmentIdFrontStorageKey` text;--> statement-breakpoint
ALTER TABLE `onboarding_applications` ADD `governmentIdBackStorageKey` text;--> statement-breakpoint
ALTER TABLE `onboarding_applications` ADD `governmentIdFaceStorageKey` text;