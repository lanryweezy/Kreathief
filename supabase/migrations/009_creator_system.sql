-- Migration 009: Creator System
-- Adds creators, assets, and asset_categories tables

-- ============================================
-- CREATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  portfolio_url TEXT,
  specialization TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_is_verified ON creators(is_verified);
CREATE INDEX idx_creators_specialization ON creators(specialization);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creators"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own creator profile"
  ON creators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creator profile"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- ASSET_CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT
);

CREATE INDEX idx_asset_categories_name ON asset_categories(name);

ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view asset categories"
  ON asset_categories FOR SELECT
  USING (true);

-- ============================================
-- ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_creator_id ON assets(creator_id);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_downloads ON assets(downloads DESC);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX idx_assets_price ON assets(price);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved assets"
  ON assets FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Creators can view their own assets"
  ON assets FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert their own assets"
  ON assets FOR INSERT
  WITH CHECK (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update their own assets"
  ON assets FOR UPDATE
  USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete their own assets"
  ON assets FOR DELETE
  USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- SEED CATEGORIES
-- ============================================
INSERT INTO asset_categories (name, icon) VALUES
  ('Icons', 'icon'),
  ('Illustrations', 'illustration'),
  ('UI Kits', 'ui-kit'),
  ('Templates', 'template'),
  ('Fonts', 'font'),
  ('Photos', 'photo'),
  ('3D Models', '3d-model'),
  ('Audio', 'audio')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- RPC: increment asset downloads
-- ============================================
CREATE OR REPLACE FUNCTION increment_asset_downloads(asset_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE assets
  SET downloads = downloads + 1
  WHERE id = asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;