-- Migration: Extend Users Table
-- Created: 2025-10-27
-- Purpose: Add email verification, password reset, and dark mode preference fields

ALTER TABLE users
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN verification_token VARCHAR(64) UNIQUE,
  ADD COLUMN verification_token_expires_at TIMESTAMP,
  ADD COLUMN reset_token VARCHAR(64) UNIQUE,
  ADD COLUMN reset_token_expires_at TIMESTAMP,
  ADD COLUMN dark_mode_preference BOOLEAN;

CREATE INDEX idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
