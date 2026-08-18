CREATE TABLE "request_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "request_rate_limits_expiry_idx" ON "request_rate_limits" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "room_signals" ADD CONSTRAINT "room_signals_sender_fk" FOREIGN KEY ("room_id","sender_id") REFERENCES "public"."room_participants"("room_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_signals" ADD CONSTRAINT "room_signals_recipient_fk" FOREIGN KEY ("room_id","recipient_id") REFERENCES "public"."room_participants"("room_id","id") ON DELETE cascade ON UPDATE no action;