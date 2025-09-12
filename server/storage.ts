import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  goldRates, 
  displaySettings, 
  mediaItems, 
  promoImages, 
  bannerSettings,
  type GoldRate,
  type InsertGoldRate,
  type DisplaySettings,
  type InsertDisplaySettings,
  type MediaItem,
  type InsertMediaItem,
  type PromoImage,
  type InsertPromoImage,
  type BannerSettings,
  type InsertBannerSettings
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { mkdirSync } from "fs";
import { join } from "path";

// Create uploads directory
const uploadsDir = join(process.cwd(), "uploads");
mkdirSync(uploadsDir, { recursive: true });

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create PostgreSQL client
const client = postgres(connectionString);
const db = drizzle(client);

// Explicit init to ensure schema exists before first queries
export async function initStorage(): Promise<void> {
  try {
    await client`
      CREATE TABLE IF NOT EXISTS gold_rates (
        id serial PRIMARY KEY,
        gold_24k_sale real NOT NULL,
        gold_24k_purchase real NOT NULL,
        gold_22k_sale real NOT NULL,
        gold_22k_purchase real NOT NULL,
        gold_18k_sale real NOT NULL,
        gold_18k_purchase real NOT NULL,
        silver_per_kg_sale real NOT NULL,
        silver_per_kg_purchase real NOT NULL,
        is_active boolean DEFAULT true,
        created_date timestamp DEFAULT now()
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS display_settings (
        id serial PRIMARY KEY,
        orientation text DEFAULT 'horizontal',
        background_color text DEFAULT '#FFF8E1',
        text_color text DEFAULT '#212529',
        rate_number_font_size text DEFAULT 'text-4xl',
        show_media boolean DEFAULT true,
        rates_display_duration_seconds integer DEFAULT 15,
        refresh_interval integer DEFAULT 30,
        created_date timestamp DEFAULT now()
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS media_items (
        id serial PRIMARY KEY,
        name text NOT NULL,
        file_url text,
        file_data text,
        media_type text NOT NULL,
        duration_seconds integer DEFAULT 30,
        order_index integer DEFAULT 0,
        is_active boolean DEFAULT true,
        file_size integer,
        mime_type text,
        created_date timestamp DEFAULT now()
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS promo_images (
        id serial PRIMARY KEY,
        name text NOT NULL,
        image_url text,
        image_data text,
        duration_seconds integer DEFAULT 5,
        transition_effect text DEFAULT 'fade',
        order_index integer DEFAULT 0,
        is_active boolean DEFAULT true,
        file_size integer,
        created_date timestamp DEFAULT now()
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS banner_settings (
        id serial PRIMARY KEY,
        banner_image_url text,
        banner_image_data text,
        banner_height integer DEFAULT 120,
        is_active boolean DEFAULT true,
        created_date timestamp DEFAULT now()
      )
    `;
  } catch {
    // Let subsequent queries surface errors; this is best-effort.
  }
}

export interface IStorage {
  // Gold Rates
  getCurrentRates(): Promise<GoldRate | undefined>;
  createGoldRate(rate: InsertGoldRate): Promise<GoldRate>;
  updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined>;
  
  // Display Settings
  getDisplaySettings(): Promise<DisplaySettings | undefined>;
  createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings>;
  updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined>;
  
  // Media Items
  getMediaItems(activeOnly?: boolean): Promise<MediaItem[]>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;
  updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined>;
  deleteMediaItem(id: number): Promise<boolean>;
  
  // Promo Images
  getPromoImages(activeOnly?: boolean): Promise<PromoImage[]>;
  createPromoImage(image: InsertPromoImage): Promise<PromoImage>;
  updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined>;
  deletePromoImage(id: number): Promise<boolean>;
  
  // Banner Settings
  getBannerSettings(): Promise<BannerSettings | undefined>;
  createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings>;
  updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined>;
}

export class PostgresStorage implements IStorage {
  // Gold Rates
  async getCurrentRates(): Promise<GoldRate | undefined> {
    const rates = await db.select().from(goldRates)
      .where(eq(goldRates.is_active, true))
      .orderBy(desc(goldRates.created_date))
      .limit(1);
    return rates[0];
  }

  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    // Deactivate all existing rates
    await db.update(goldRates).set({ is_active: false });
    
    const result = await db.insert(goldRates).values(rate).returning();
    return result[0];
  }

  async updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined> {
    const result = await db.update(goldRates)
      .set(rate)
      .where(eq(goldRates.id, id))
      .returning();
    return result[0];
  }

  // Display Settings
  async createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings> {
    const result = await db.insert(displaySettings).values(settings).returning();
    return result[0];
  } 

  async getDisplaySettings(): Promise<DisplaySettings | undefined> {
    const settings = await db.select().from(displaySettings)
      .orderBy(desc(displaySettings.created_date))
      .limit(1);
    return settings[0];
  }

  async updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined> {
    const result = await db.update(displaySettings)
      .set(settings)
      .where(eq(displaySettings.id, id))
      .returning();
    return result[0];
  }

  // Media Items
  async getMediaItems(activeOnly = false): Promise<MediaItem[]> {
    if (activeOnly) {
      return await db.select().from(mediaItems)
        .where(eq(mediaItems.is_active, true))
        .orderBy(asc(mediaItems.order_index));
    }
    
    return await db.select().from(mediaItems)
      .orderBy(asc(mediaItems.order_index));
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    const result = await db.insert(mediaItems).values(item).returning();
    return result[0];
  }

  async updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    const result = await db.update(mediaItems)
      .set(item)
      .where(eq(mediaItems.id, id))
      .returning();
    return result[0];
  }

  async deleteMediaItem(id: number): Promise<boolean> {
    const result = await db.delete(mediaItems).where(eq(mediaItems.id, id)).returning();
    return result.length > 0;
  }

  // Promo Images
  async getPromoImages(activeOnly = false): Promise<PromoImage[]> {
    if (activeOnly) {
      return await db.select().from(promoImages)
        .where(eq(promoImages.is_active, true))
        .orderBy(asc(promoImages.order_index));
    }
    
    return await db.select().from(promoImages)
      .orderBy(asc(promoImages.order_index));
  }

  async createPromoImage(image: InsertPromoImage): Promise<PromoImage> {
    const result = await db.insert(promoImages).values(image).returning();
    return result[0];
  }

  async updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined> {
    const result = await db.update(promoImages)
      .set(image)
      .where(eq(promoImages.id, id))
      .returning();
    return result[0];
  }

  async deletePromoImage(id: number): Promise<boolean> {
    const result = await db.delete(promoImages).where(eq(promoImages.id, id)).returning();
    return result.length > 0;
  }

  // Banner Settings
  async getBannerSettings(): Promise<BannerSettings | undefined> {
    const banner = await db.select().from(bannerSettings)
      .where(eq(bannerSettings.is_active, true))
      .orderBy(desc(bannerSettings.created_date))
      .limit(1);
    return banner[0];
  }

  async createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings> {
    const result = await db.insert(bannerSettings).values(banner).returning();
    return result[0];
  }

  async updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined> {
    const result = await db.update(bannerSettings)
      .set(banner)
      .where(eq(bannerSettings.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
