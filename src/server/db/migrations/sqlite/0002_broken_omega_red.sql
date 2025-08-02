PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_job_results` (
	`job_id` text PRIMARY KEY NOT NULL,
	`planned_at` integer,
	`attempted_at` integer,
	`duration_ms` integer,
	`status_code` integer,
	`headers` text NOT NULL,
	`response_body` text,
	`timed_out` integer NOT NULL,
	`error` text,
	FOREIGN KEY (`job_id`) REFERENCES `scheduled_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_job_results`("job_id", "planned_at", "attempted_at", "duration_ms", "status_code", "headers", "response_body", "timed_out", "error") SELECT "job_id", "planned_at", "attempted_at", "duration_ms", "status_code", "headers", "response_body", "timed_out", "error" FROM `job_results`;--> statement-breakpoint
DROP TABLE `job_results`;--> statement-breakpoint
ALTER TABLE `__new_job_results` RENAME TO `job_results`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `job_results_planned_at_idx` ON `job_results` (`planned_at`);--> statement-breakpoint
CREATE INDEX `job_results_attempted_at_idx` ON `job_results` (`attempted_at`);--> statement-breakpoint
CREATE INDEX `job_results_response_status_code_idx` ON `job_results` (`status_code`);--> statement-breakpoint
ALTER TABLE `cron_jobs` ADD `timeout_ms` integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduled_jobs` ADD `cron_job_id` text REFERENCES cron_jobs(id);