CREATE TABLE `cron_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`cron_expression` text NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`headers` text NOT NULL,
	`body` text NOT NULL,
	`metadata` text NOT NULL
);
