ALTER TABLE `cron_jobs` ADD `disabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `disabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scheduled_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`cron_id` text,
	`message_id` text,
	`queue_id` text,
	`assigned_to` text,
	`disabled` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`cron_id`) REFERENCES `cron_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`queue_id`) REFERENCES `queues`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "scheduled_jobs_link_to_request_schema" CHECK((("__new_scheduled_jobs"."message_id" is null and "__new_scheduled_jobs"."cron_id" is not null) or ("__new_scheduled_jobs"."message_id" is not null and "__new_scheduled_jobs"."cron_id" is null)))
);
--> statement-breakpoint
INSERT INTO `__new_scheduled_jobs`("id", "planned_at", "cron_id", "message_id", "queue_id", "assigned_to") SELECT "id", "planned_at", "cron_id", "message_id", "queue_id", "assigned_to" FROM `scheduled_jobs`;--> statement-breakpoint
DROP TABLE `scheduled_jobs`;--> statement-breakpoint
ALTER TABLE `__new_scheduled_jobs` RENAME TO `scheduled_jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
