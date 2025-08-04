PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scheduled_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text,
	`body` text,
	`metadata` text,
	`timeout_ms` integer DEFAULT 3000 NOT NULL,
	`cron_id` text,
	`message_id` text,
	`queue_id` text,
	FOREIGN KEY (`cron_id`) REFERENCES `cron_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`queue_id`) REFERENCES `queues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_scheduled_jobs`("id", "planned_at", "url", "method", "headers", "body", "metadata", "timeout_ms", "cron_id", "message_id", "queue_id") SELECT "id", "planned_at", "url", "method", "headers", "body", "metadata", "timeout_ms", "cron_id", "message_id", "queue_id" FROM `scheduled_jobs`;--> statement-breakpoint
DROP TABLE `scheduled_jobs`;--> statement-breakpoint
ALTER TABLE `__new_scheduled_jobs` RENAME TO `scheduled_jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;