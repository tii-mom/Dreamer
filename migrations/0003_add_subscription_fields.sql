-- Migration: Add subscription fields to users
ALTER TABLE users ADD COLUMN subscribed_until TEXT;
ALTER TABLE users ADD COLUMN subscription_plan TEXT;
