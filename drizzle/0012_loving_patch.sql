ALTER TABLE `payment_orders` ADD `officialReceiptCode` varchar(48);--> statement-breakpoint
ALTER TABLE `payment_orders` ADD `receiptIssuedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_officialReceiptCode_unique` UNIQUE(`officialReceiptCode`);