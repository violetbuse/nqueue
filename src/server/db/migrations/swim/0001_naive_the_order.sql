PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_self` (
	`key` text PRIMARY KEY DEFAULT 'self' NOT NULL,
	`id` text NOT NULL,
	`address` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`data_version` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "key_can_only_be_self" CHECK("__new_self"."key" = 'self')
);
--> statement-breakpoint
INSERT INTO `__new_self`("key", "id", "address", "tags", "data_version") SELECT "key", "id", "address", "tags", "data_version" FROM `self`;--> statement-breakpoint
DROP TABLE `self`;--> statement-breakpoint
ALTER TABLE `__new_self` RENAME TO `self`;--> statement-breakpoint
PRAGMA foreign_keys=ON;