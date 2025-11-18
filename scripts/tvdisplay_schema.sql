-- TV Display App Database Schema
-- Matches current TypeScript schema (shared/schema.ts) including file_data/image_data columns

BEGIN;

-- 1) gold_rates
CREATE TABLE IF NOT EXISTS gold_rates (
  id SERIAL PRIMARY KEY,
  gold_24k_sale REAL NOT NULL,
  gold_24k_purchase REAL NOT NULL,
  gold_22k_sale REAL NOT NULL,
  gold_22k_purchase REAL NOT NULL,
  gold_18k_sale REAL NOT NULL,
  gold_18k_purchase REAL NOT NULL,
  silver_per_kg_sale REAL NOT NULL,
  silver_per_kg_purchase REAL NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Helpful index for "latest active" lookups
CREATE INDEX IF NOT EXISTS idx_gold_rates_active_created
  ON gold_rates (is_active, created_date);

-- 2) display_settings
CREATE TABLE IF NOT EXISTS display_settings (
  id SERIAL PRIMARY KEY,
  orientation TEXT DEFAULT 'horizontal',
  background_color TEXT DEFAULT '#FFF8E1',
  text_color TEXT DEFAULT '#212529',
  rate_number_font_size TEXT DEFAULT 'text-4xl',
  show_media BOOLEAN DEFAULT TRUE,
  rates_display_duration_seconds INTEGER DEFAULT 15,
  refresh_interval INTEGER DEFAULT 30,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_display_settings_created
  ON display_settings (created_date);

-- 3) media_items
-- Note: file_url is kept for backward compatibility and is nullable.
--       file_data stores base64-encoded data (TEXT) for cloud/fileless deployments.
CREATE TABLE IF NOT EXISTS media_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT,
  file_data TEXT,
  media_type TEXT NOT NULL, -- 'image' or 'video'
  duration_seconds INTEGER DEFAULT 30,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  file_size INTEGER,
  mime_type TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_items_active_order
  ON media_items (is_active, order_index);

-- 4) promo_images
-- Note: image_url kept for backward compatibility, image_data stores base64-encoded data.
CREATE TABLE IF NOT EXISTS promo_images (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  image_data TEXT,
  duration_seconds INTEGER DEFAULT 5,
  transition_effect TEXT DEFAULT 'fade',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  file_size INTEGER,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_images_active_order
  ON promo_images (is_active, order_index);

-- 5) banner_settings
-- Note: banner_image_url kept for backward compatibility, banner_image_data stores base64-encoded data.
CREATE TABLE IF NOT EXISTS banner_settings (
  id SERIAL PRIMARY KEY,
  banner_image_url TEXT,
  banner_image_data TEXT,
  banner_height INTEGER DEFAULT 120,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banner_settings_active_created
  ON banner_settings (is_active, created_date);

COMMIT;

-- Optional: seed minimal defaults (uncomment if needed)
-- INSERT INTO display_settings DEFAULT VALUES;
-- INSERT INTO gold_rates (
--   gold_24k_sale, gold_24k_purchase,
--   gold_22k_sale, gold_22k_purchase,
--   gold_18k_sale, gold_18k_purchase,
--   silver_per_kg_sale, silver_per_kg_purchase, is_active
-- ) VALUES (74850, 73200, 68620, 67100, 56140, 54900, 92500, 90800, TRUE);