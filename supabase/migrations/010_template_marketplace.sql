-- Migration 010: Template Marketplace

CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_categories_slug ON marketplace_categories(slug);
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view marketplace categories" ON marketplace_categories FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS marketplace_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  template_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_templates_author_id ON marketplace_templates(author_id);
CREATE INDEX idx_marketplace_templates_category ON marketplace_templates(category);
CREATE INDEX idx_marketplace_templates_status ON marketplace_templates(status);
CREATE INDEX idx_marketplace_templates_likes ON marketplace_templates(likes DESC);
CREATE INDEX idx_marketplace_templates_downloads ON marketplace_templates(downloads DESC);
CREATE INDEX idx_marketplace_templates_created_at ON marketplace_templates(created_at DESC);
CREATE INDEX idx_marketplace_templates_tags ON marketplace_templates USING GIN(tags);

ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved templates" ON marketplace_templates FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own pending templates" ON marketplace_templates FOR SELECT USING (author_id = auth.uid());
CREATE POLICY "Authenticated users can submit templates" ON marketplace_templates FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own templates" ON marketplace_templates FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own templates" ON marketplace_templates FOR DELETE USING (author_id = auth.uid());

INSERT INTO marketplace_categories (name, slug, icon, display_order) VALUES
  ('Posters', 'posters', 'poster', 1), ('Social', 'social', 'social', 2),
  ('Print', 'print', 'print', 3), ('Corporate', 'corporate', 'corporate', 4),
  ('Branding', 'branding', 'branding', 5), ('UI/UX', 'ui-ux', 'ui', 6),
  ('Illustration', 'illustration', 'illustration', 7), ('Other', 'other', 'other', 8)
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_marketplace_template_likes(template_id UUID) RETURNS void AS $$
BEGIN UPDATE marketplace_templates SET likes = likes + 1, updated_at = NOW() WHERE id = template_id; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_marketplace_template_downloads(template_id UUID) RETURNS void AS $$
BEGIN UPDATE marketplace_templates SET downloads = downloads + 1, updated_at = NOW() WHERE id = template_id; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_marketplace_template_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marketplace_templates_updated_at
  BEFORE UPDATE ON marketplace_templates FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_template_timestamp();
