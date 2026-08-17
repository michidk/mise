CREATE TABLE "room_participants" (
	"id" text NOT NULL,
	"room_id" text NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	CONSTRAINT "room_participants_room_id_id_pk" PRIMARY KEY("room_id","id")
);
--> statement-breakpoint
CREATE TABLE "room_signals" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "room_signals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"room_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "room_signals_kind_check" CHECK ("room_signals"."kind" in ('description', 'candidate'))
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"host_id" text NOT NULL,
	"password_hash" text,
	"max_participants" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "rooms_participant_limit_check" CHECK ("rooms"."max_participants" between 2 and 20)
);
--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_signals" ADD CONSTRAINT "room_signals_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_participants_presence_idx" ON "room_participants" USING btree ("room_id","last_seen_at");--> statement-breakpoint
CREATE INDEX "room_signals_recipient_idx" ON "room_signals" USING btree ("room_id","recipient_id","id");