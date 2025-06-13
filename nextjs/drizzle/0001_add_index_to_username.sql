ALTER TABLE "user" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "user" USING btree ("username");