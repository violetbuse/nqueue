PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assigned_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_at` integer NOT NULL,
	`request_url` text NOT NULL,
	`request_method` text NOT NULL,
	`request_headers` text NOT NULL,
	`request_body` text,
	`timeout_ms` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_assigned_jobs`("id", "planned_at", "request_url", "request_method", "request_headers", "request_body", "timeout_ms") SELECT "id", "planned_at", "request_url", "request_method", "request_headers", "request_body", "timeout_ms" FROM `assigned_jobs`;--> statement-breakpoint
DROP TABLE `assigned_jobs`;--> statement-breakpoint
ALTER TABLE `__new_assigned_jobs` RENAME TO `assigned_jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;