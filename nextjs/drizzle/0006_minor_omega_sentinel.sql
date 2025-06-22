ALTER TABLE "tags" RENAME COLUMN "user_id" TO "username";--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "tags_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_username_user_username_fk" FOREIGN KEY ("username") REFERENCES "public"."user"("username") ON DELETE cascade ON UPDATE no action;