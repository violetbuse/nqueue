ALTER TABLE `scheduled_jobs` ADD `assigned_to` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_job_results` (
	`id` text PRIMARY KEY NOT NULL,
	`status_code` integer,
	`headers` text,
	`response_body` text,
	`executed_at` integer,
	`duration_ms` integer,
	`error` text,
	`timed_out` integer DEFAULT false,
	FOREIGN KEY (`id`) REFERENCES `scheduled_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "job_result_check_all_or_none_response_data" CHECK((("__new_job_results"."status_code" is null and "__new_job_results"."headers" is null and "__new_job_results"."response_body" is null) or ("__new_job_results"."status_code" is not null and "__new_job_results"."headers" is not null and "__new_job_results"."response_body" is not null and "__new_job_results"."timed_out" = ? and "__new_job_results"."error" is null)))
);
--> statement-breakpoint
INSERT INTO `__new_job_results`("id", "status_code", "headers", "response_body", "executed_at", "duration_ms", "error", "timed_out") SELECT "id", "status_code", "headers", "response_body", "executed_at", "duration_ms", "error", "timed_out" FROM `job_results`;--> statement-breakpoint
DROP TABLE `job_results`;--> statement-breakpoint
ALTER TABLE `__new_job_results` RENAME TO `job_results`;--> statement-breakpoint
PRAGMA foreign_keys=ON;