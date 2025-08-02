PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cron_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`cron_expression` text NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text NOT NULL,
	`body` text NOT NULL,
	`timeout_ms` integer NOT NULL,
	`metadata` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_cron_jobs`("id", "cron_expression", "url", "method", "headers", "body", "timeout_ms", "metadata") SELECT "id", "cron_expression", "url", "method", "headers", "body", "timeout_ms", "metadata" FROM `cron_jobs`;--> statement-breakpoint
DROP TABLE `cron_jobs`;--> statement-breakpoint
ALTER TABLE `__new_cron_jobs` RENAME TO `cron_jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;