ALTER TABLE "user_tags" RENAME COLUMN "user_id" TO "username";--> statement-breakpoint
ALTER TABLE "user_tags" DROP CONSTRAINT "user_tags_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_tags" DROP CONSTRAINT "user_tags_user_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_username_tag_id_pk" PRIMARY KEY("username","tag_id");--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_username_user_username_fk" FOREIGN KEY ("username") REFERENCES "public"."user"("username") ON DELETE cascade ON UPDATE no action;