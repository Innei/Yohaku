CREATE TABLE `liked_refs` (
	`ref_id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`liked_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `thinkings` ADD `comments_index` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `thinkings` ADD `allow_comment` integer DEFAULT true NOT NULL;