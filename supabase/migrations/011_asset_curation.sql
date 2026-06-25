-- Migration 011: Asset Curation System

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'photo',
  thumbnail_url TEXT,
  asset_url TEXT NOT NULL,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_favorites_created_at ON user_favorites(created_at DESC);
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON user_collections(user_id);
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collections" ON user_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create collections" ON user_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON user_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON user_collections FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  thumbnail_url TEXT,
  provider TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_position ON collection_items(position);
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collection items" ON collection_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can add collection items" ON collection_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own collection items" ON collection_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own collection items" ON collection_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_collection_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON user_collections FOR EACH ROW
  EXECUTE FUNCTION update_collection_timestamp();
