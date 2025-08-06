CREATE TABLE `assigned_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`request_url` text NOT NULL,
	`request_method` text NOT NULL,
	`request_headers` text NOT NULL,
	`request_body` text NOT NULL,
	`timeout_ms` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cached_job_results` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`attempted_at` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`result_status_code` integer,
	`result_headers` text,
	`result_body` text,
	`timed_out` integer NOT NULL,
	`error` text,
	`cached_at` integer NOT NULL,
	CONSTRAINT "cached_job_results_status_headers_body_all_null_or_none_null" CHECK((("cached_job_results"."result_status_code" is null and "cached_job_results"."result_headers" is null and "cached_job_results"."result_body" is null) or ("cached_job_results"."result_status_code" is not null and "cached_job_results"."result_headers" is not null and "cached_job_results"."result_body" is not null)))
);
