CREATE TABLE `node_tags` (
	`node_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`node_id`, `tag`),
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`node_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag`) REFERENCES `tags`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`node_id` text PRIMARY KEY NOT NULL,
	`address` text NOT NULL,
	`state` text DEFAULT 'alive' NOT NULL,
	`data_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `self` (
	`key` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`address` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`data_version` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "key_can_only_be_self" CHECK("self"."key" = ?)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`name` text PRIMARY KEY NOT NULL
);
