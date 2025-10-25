-- Migration to add background_color field to existing site_settings table
-- Run this in your Supabase SQL Editor if you already have the site_settings table

-- Add background_color column with default value
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS background_color TEXT NOT NULL DEFAULT 'white';
