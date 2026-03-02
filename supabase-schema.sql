-- ============================================================
-- NYN Impact — Supabase Schema Migration
-- Project: kdeujojzurjswwmbfgdv
-- ============================================================
-- This project already has a generated_sites table from SpokenSite.
-- We rename it to preserve that data, then create the new structure.
-- Run this ONCE in Supabase SQL Editor.
-- ============================================================

-- Step 1: Rename old SpokenSite table to avoid collision
ALTER TABLE IF EXISTS generated_sites RENAME TO spokensite_generated_sites;

-- Step 2: Also check for WhatsCoolAbout companies table (preserve it)
-- (companies table stays as-is, no conflict)

-- ============================================================
-- NYN Impact Tables
-- ============================================================

-- ── Customers ──
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Projects (one per website build) ──
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead','interview','processing','choosing','editing','active','archived')),
  interview_conversation_id TEXT,
  transcript TEXT,
  autopsy_data JSONB,
  competitor_research JSONB,
  industry_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Generated Sites (NYN Impact version — 2 per project initially) ──
CREATE TABLE generated_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL DEFAULT 'Version A',
  content_schema JSONB NOT NULL DEFAULT '{}',
  template_code TEXT,
  vercel_url TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Edit History ──
CREATE TABLE IF NOT EXISTS edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES generated_sites(id) ON DELETE CASCADE,
  field_path TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ai_prompt TEXT,
  edit_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Site Images ──
CREATE TABLE IF NOT EXISTS site_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES generated_sites(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_key TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_sites_project ON generated_sites(project_id);
CREATE INDEX IF NOT EXISTS idx_sites_published ON generated_sites(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_edits_site ON edit_history(site_id);
CREATE INDEX IF NOT EXISTS idx_edits_created ON edit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_site ON site_images(site_id);

-- ============================================================
-- Done! Tables created:
--   customers          — lead capture
--   projects           — one per website build
--   generated_sites    — NEW structure (content_schema + template)
--   edit_history       — AI self-edit audit trail
--   site_images        — uploaded images
--   spokensite_generated_sites — OLD SpokenSite data (preserved)
-- ============================================================
