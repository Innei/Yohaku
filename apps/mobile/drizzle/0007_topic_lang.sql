DROP TABLE `topics`;--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text NOT NULL,
	`lang` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`introduce` text,
	`icon` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`id`, `lang`)
);
