PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notes` (
	`id` text NOT NULL,
	`lang` text NOT NULL,
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
	`body_version` integer,
	`enrichments` text,
	`article_meta` text,
	PRIMARY KEY(`id`, `lang`)
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "lang", "nid", "title", "mood", "weather", "excerpt", "text", "content", "content_format", "has_password", "read_count", "like_count", "created_at", "modified_at", "body_version", "enrichments", "article_meta") SELECT "id", 'zh', "nid", "title", "mood", "weather", "excerpt", "text", "content", "content_format", "has_password", "read_count", "like_count", "created_at", "modified_at", "body_version", "enrichments", NULL FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `notes_nid_lang_unique` ON `notes` (`nid`,`lang`);--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` text NOT NULL,
	`lang` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`id`, `lang`)
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "lang", "name", "slug", "type") SELECT "id", 'zh', "name", "slug", "type" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text NOT NULL,
	`lang` text NOT NULL,
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
	`body_version` integer,
	`enrichments` text,
	`article_meta` text,
	PRIMARY KEY(`id`, `lang`)
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "lang", "slug", "title", "category_id", "category_slug", "category_name", "tags", "excerpt", "text", "content", "content_format", "read_count", "like_count", "created_at", "modified_at", "pin_at", "body_version", "enrichments", "article_meta") SELECT "id", 'zh', "slug", "title", "category_id", "category_slug", "category_name", "tags", "excerpt", "text", "content", "content_format", "read_count", "like_count", "created_at", "modified_at", "pin_at", "body_version", "enrichments", NULL FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;