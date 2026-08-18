CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`nid` integer NOT NULL,
	`title` text NOT NULL,
	`mood` text,
	`weather` text,
	`excerpt` text,
	`text` text,
	`content` text,
	`content_format` text,
	`has_password` integer DEFAULT false NOT NULL,
	`read_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`modified_at` integer,
	`body_version` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_nid_unique` ON `notes` (`nid`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category_id` text,
	`category_slug` text,
	`category_name` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`excerpt` text,
	`text` text,
	`content` text,
	`content_format` text,
	`read_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`modified_at` integer,
	`pin_at` integer,
	`body_version` integer
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`collection` text PRIMARY KEY NOT NULL,
	`last_sync_at` integer
);
--> statement-breakpoint
CREATE TABLE `thinkings` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`up` integer DEFAULT 0 NOT NULL,
	`down` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`modified_at` integer
);
