CREATE TABLE `job_results` (
	`job_id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`attempted_at` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`status_code` integer,
	`headers` text NOT NULL,
	`response_body` text,
	`timed_out` integer NOT NULL,
	`error` text,
	FOREIGN KEY (`job_id`) REFERENCES `scheduled_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `job_results_planned_at_idx` ON `job_results` (`planned_at`);--> statement-breakpoint
CREATE INDEX `job_results_attempted_at_idx` ON `job_results` (`attempted_at`);--> statement-breakpoint
CREATE INDEX `job_results_response_status_code_idx` ON `job_results` (`status_code`);--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`assigned` integer DEFAULT false NOT NULL,
	`planned_at` integer NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text NOT NULL,
	`body` text NOT NULL,
	`metadata` text NOT NULL,
	`timeout_ms` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scheduled_jobs_planned_at_idx` ON `scheduled_jobs` (`planned_at`);--> statement-breakpoint
CREATE INDEX `scheduled_jobs_assigned_idx` ON `scheduled_jobs` (`assigned`);