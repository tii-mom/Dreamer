-- Migration 0005_fix_payments_referral_fields

-- Add referral_code and operator_user_id to payments table
ALTER TABLE payments ADD COLUMN referral_code TEXT;
ALTER TABLE payments ADD COLUMN operator_user_id TEXT;
