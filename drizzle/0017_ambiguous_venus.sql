ALTER TABLE `payment_orders` MODIFY COLUMN `type` enum('agent_access','listing_pass','featured_pin','physical_verification','welcome_bundle','starter_access','pro_access','physical_verification_route_batch','physical_verification_individual') NOT NULL;--> statement-breakpoint
ALTER TABLE `platform_settings` MODIFY COLUMN `featuredPinFeeXaf` int NOT NULL DEFAULT 2500;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `welcomeBundleUsedAt` timestamp;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `starterAccessFeeXaf` int DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `proAccessFeeXaf` int DEFAULT 25000 NOT NULL;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `routeBatchVerificationFeeXaf` int DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE `verification_orders` ADD `serviceType` enum('route_batch','individual') DEFAULT 'individual' NOT NULL;
--> statement-breakpoint
ALTER TABLE `payment_orders` MODIFY COLUMN `type` enum('agent_access','listing_pass','featured_pin','physical_verification','welcome_bundle','starter_access','pro_access','physical_verification_route_batch','physical_verification_individual') NOT NULL;
