ALTER TABLE "player" RENAME TO "person";
ALTER TABLE "person" DROP CONSTRAINT "player_group_id_group_id_fk";

ALTER TABLE "person" DROP CONSTRAINT "player_to_id_player_id_fk";

ALTER TABLE "person" ADD CONSTRAINT "person_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "person" ADD CONSTRAINT "person_to_id_person_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;