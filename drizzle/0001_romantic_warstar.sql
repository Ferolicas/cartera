CREATE TYPE "public"."betting_transaction_type" AS ENUM('income', 'withdrawal');--> statement-breakpoint
CREATE TABLE "betting_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" varchar(160) NOT NULL,
	"amount_cents" integer NOT NULL,
	"type" "betting_transaction_type" NOT NULL,
	"due_date" date NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "betting_transactions_amount_positive" CHECK ("betting_transactions"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE INDEX "betting_transactions_due_date_idx" ON "betting_transactions" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "betting_transactions_type_status_idx" ON "betting_transactions" USING btree ("type","status");