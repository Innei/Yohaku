CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`introduce` text,
	`icon` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `notes` ADD `topic_id` text;