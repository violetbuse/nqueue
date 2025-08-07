ALTER TABLE `queues` ADD `disabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduled_jobs` DROP COLUMN `disabled`;