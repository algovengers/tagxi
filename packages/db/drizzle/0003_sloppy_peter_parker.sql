ALTER TABLE "tags" ALTER COLUMN "seen" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "message" text;