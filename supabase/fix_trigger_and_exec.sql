-- Fix 1: Create exec_sql helper function (for future migrations)
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Recreate handle_new_user trigger (in case it failed)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix 3: Create profile for existing test user
INSERT INTO public.profiles (id, email, name, plan)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 'free'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Fix 4: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Fix 5: RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects
DROP POLICY IF EXISTS "Users can view own or public projects" ON public.projects;
CREATE POLICY "Users can view own or public projects" ON public.projects FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Templates
DROP POLICY IF EXISTS "Anyone can view public templates" ON public.templates;
CREATE POLICY "Anyone can view public templates" ON public.templates FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own templates" ON public.templates;
CREATE POLICY "Users can manage own templates" ON public.templates FOR ALL USING (auth.uid() = user_id);

-- Comments
DROP POLICY IF EXISTS "Anyone can view comments on public projects" ON public.comments;
CREATE POLICY "Anyone can view comments on public projects" ON public.comments FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Share links
DROP POLICY IF EXISTS "Users can manage own share links" ON public.share_links;
CREATE POLICY "Users can manage own share links" ON public.share_links FOR ALL USING (auth.uid() = user_id);

-- Brand kits
DROP POLICY IF EXISTS "Users can manage own brand kits" ON public.brand_kits;
CREATE POLICY "Users can manage own brand kits" ON public.brand_kits FOR ALL USING (auth.uid() = user_id);

-- Project versions
DROP POLICY IF EXISTS "Users can manage own versions" ON public.project_versions;
CREATE POLICY "Users can manage own versions" ON public.project_versions FOR ALL USING (auth.uid() = user_id);

-- Project snapshots
DROP POLICY IF EXISTS "Users can manage own snapshots" ON public.project_snapshots;
CREATE POLICY "Users can manage own snapshots" ON public.project_snapshots FOR ALL USING (auth.uid() = user_id);

-- Community templates (public read, authenticated write)
DROP POLICY IF EXISTS "Anyone can view community templates" ON public.community_templates;
CREATE POLICY "Anyone can view community templates" ON public.community_templates FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can insert community templates" ON public.community_templates;
CREATE POLICY "Authenticated users can insert community templates" ON public.community_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own community templates" ON public.community_templates;
CREATE POLICY "Users can update own community templates" ON public.community_templates FOR UPDATE USING (auth.uid() = user_id);

-- Creators
DROP POLICY IF EXISTS "Anyone can view creators" ON public.creators;
CREATE POLICY "Anyone can view creators" ON public.creators FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can manage own creator profile" ON public.creators;
CREATE POLICY "Users can manage own creator profile" ON public.creators FOR ALL USING (auth.uid() = user_id);

-- Assets
DROP POLICY IF EXISTS "Anyone can view assets" ON public.assets;
CREATE POLICY "Anyone can view assets" ON public.assets FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can insert assets" ON public.assets;
CREATE POLICY "Authenticated users can insert assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Asset categories (public read)
DROP POLICY IF EXISTS "Anyone can view asset categories" ON public.asset_categories;
CREATE POLICY "Anyone can view asset categories" ON public.asset_categories FOR SELECT USING (TRUE);

-- Collection items
DROP POLICY IF EXISTS "Users can manage own collection items" ON public.collection_items;
CREATE POLICY "Users can manage own collection items" ON public.collection_items FOR ALL USING (auth.uid() = user_id);

-- User collections
DROP POLICY IF EXISTS "Users can manage own collections" ON public.user_collections;
CREATE POLICY "Users can manage own collections" ON public.user_collections FOR ALL USING (auth.uid() = user_id);

-- User favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites" ON public.user_favorites FOR ALL USING (auth.uid() = user_id);

-- Marketplace categories (public read)
DROP POLICY IF EXISTS "Anyone can view marketplace categories" ON public.marketplace_categories;
CREATE POLICY "Anyone can view marketplace categories" ON public.marketplace_categories FOR SELECT USING (TRUE);

-- Marketplace templates
DROP POLICY IF EXISTS "Anyone can view marketplace templates" ON public.marketplace_templates;
CREATE POLICY "Anyone can view marketplace templates" ON public.marketplace_templates FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can manage marketplace templates" ON public.marketplace_templates;
CREATE POLICY "Authenticated users can manage marketplace templates" ON public.marketplace_templates FOR ALL USING (auth.uid() = user_id);

-- Security logs
DROP POLICY IF EXISTS "Users can view own security logs" ON public.security_logs;
CREATE POLICY "Users can view own security logs" ON public.security_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
CREATE POLICY "System can insert security logs" ON public.security_logs FOR INSERT WITH CHECK (TRUE);
