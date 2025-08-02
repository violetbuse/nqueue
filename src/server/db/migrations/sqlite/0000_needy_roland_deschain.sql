CREATE TABLE `cron_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`cron_expression` text NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text NOT NULL,
	`body` text NOT NULL,
	`metadata` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runner_jobs` (
	`job_id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text NOT NULL,
	`body` text NOT NULL,
	`timeout_ms` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `runner_jobs_planned_at_idx` ON `runner_jobs` (`planned_at`);--> statement-breakpoint
CREATE TABLE `runner_results_cache` (
	`job_id` text PRIMARY KEY NOT NULL,
	`inserted_at` integer NOT NULL,
	`planned_at` integer NOT NULL,
	`attempted_at` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`status_code` integer,
	`headers` text NOT NULL,
	`body` text,
	`timed_out` integer DEFAULT false NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `runner_results_cache_inserted_at_idx` ON `runner_results_cache` (`inserted_at`);--> statement-breakpoint
CREATE INDEX `runner_results_cache_planned_at_idx` ON `runner_results_cache` (`planned_at`);--> statement-breakpoint
CREATE INDEX `runner_results_cache_attempted_at_idx` ON `runner_results_cache` (`attempted_at`);