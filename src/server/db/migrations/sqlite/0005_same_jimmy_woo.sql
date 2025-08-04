CREATE TABLE `cron_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`expression` text NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text,
	`body` text,
	`metadata` text,
	`timeout_ms` integer NOT NULL,
	`next_invocation_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cron_jobs_next_invocation_at_idx` ON `cron_jobs` (`next_invocation_at`);--> statement-breakpoint
CREATE TABLE `job_results` (
	`id` text PRIMARY KEY NOT NULL,
	`status_code` integer,
	`headers` text,
	`response_body` text,
	`executed_at` integer,
	`duration_ms` integer,
	`error` text,
	`timed_out` integer DEFAULT false,
	FOREIGN KEY (`id`) REFERENCES `scheduled_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text,
	`metadata` text,
	`body` text,
	`timeout_ms` integer NOT NULL,
	`queue_id` text,
	`queue_index` integer,
	`scheduled_at` integer,
	FOREIGN KEY (`queue_id`) REFERENCES `queues`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "valid_scheduling" CHECK((("messages"."scheduled_at" is null and "messages"."queue_id" is not null and "messages"."queue_index" is not null) or ("messages"."scheduled_at" is not null and "messages"."queue_id" is null and "messages"."queue_index" is null)))
);
--> statement-breakpoint
CREATE INDEX `messages_scheduled_at_idx` ON `messages` (`scheduled_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `messages_queue_id_queue_index_unique_idx` ON `messages` (`queue_id`,`queue_index`);--> statement-breakpoint
CREATE TABLE `queues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`description` text,
	`requests_per_period` integer NOT NULL,
	`period_length_seconds` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text,
	`metadata` text,
	`body` text,
	`cron_id` text,
	`message_id` text,
	`queue_id` text,
	FOREIGN KEY (`cron_id`) REFERENCES `cron_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`queue_id`) REFERENCES `queues`(`id`) ON UPDATE no action ON DELETE no action
);
