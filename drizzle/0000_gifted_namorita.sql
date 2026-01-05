CREATE TABLE "group" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_id" uuid
);

CREATE TABLE "player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" serial NOT NULL,
	"name" text NOT NULL,
	"to_id" uuid
);

CREATE TABLE "pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "group" ADD CONSTRAINT "group_pool_id_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pool"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "player" ADD CONSTRAINT "player_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "player" ADD CONSTRAINT "player_to_id_player_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."player"("id") ON DELETE no action ON UPDATE no action;