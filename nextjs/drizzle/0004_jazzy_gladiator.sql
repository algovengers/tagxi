ALTER TABLE "tags" ADD COLUMN "site" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "metadata" jsonb;