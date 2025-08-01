CREATE TABLE "cron_jobs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"expression" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"method" varchar(16) NOT NULL,
	"headers" json NOT NULL,
	"body" text NOT NULL,
	"metadata" json NOT NULL
);
