CREATE TABLE `voice_members` (
	`room_code` text NOT NULL,
	`player_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`room_code`, `player_id`)
);
--> statement-breakpoint
CREATE INDEX `voice_members_room_updated` ON `voice_members` (`room_code`,`updated_at`);--> statement-breakpoint
CREATE TABLE `voice_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`sender_id` text NOT NULL,
	`target_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `voice_signals_target_created` ON `voice_signals` (`room_code`,`target_id`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
