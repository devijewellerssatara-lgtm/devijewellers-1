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

// Create PostgreSQL client only if configured
let db: ReturnType<typeof drizzle> | undefined;
if (connectionString) {
  const client = postgres(connectionString);
  db = drizzle(client);
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

// Postgres implementation (requires db)
export class PostgresStorage implements IStorage {
  private db = db!;

  // Gold Rates
  async getCurrentRates(): Promise<GoldRate | undefined> {
    const rates = await this.db.select().from(goldRates)
      .where(eq(goldRates.is_active, true))
      .orderBy(desc(goldRates.created_date))
      .limit(1);
    return rates[0];
  }

  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    // Deactivate all existing rates
    await this.db.update(goldRates).set({ is_active: false });
    
    const result = await this.db.insert(goldRates).values(rate).returning();
    return result[0];
  }

  async updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined> {
    const result = await this.db.update(goldRates)
      .set(rate)
      .where(eq(goldRates.id, id))
      .returning();
    return result[0];
  }

  // Display Settings
  async createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings> {
    const result = await this.db.insert(displaySettings).values(settings).returning();
    return result[0];
  } 

  async getDisplaySettings(): Promise<DisplaySettings | undefined> {
    const settings = await this.db.select().from(displaySettings)
      .orderBy(desc(displaySettings.created_date))
      .limit(1);
    return settings[0];
  }

  async updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined> {
    const result = await this.db.update(displaySettings)
      .set(settings)
      .where(eq(displaySettings.id, id))
      .returning();
    return result[0];
  }

  // Media Items
  async getMediaItems(activeOnly = false): Promise<MediaItem[]> {
    if (activeOnly) {
      return await this.db.select().from(mediaItems)
        .where(eq(mediaItems.is_active, true))
        .orderBy(asc(mediaItems.order_index));
    }
    
    return await this.db.select().from(mediaItems)
      .orderBy(asc(mediaItems.order_index));
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    const result = await this.db.insert(mediaItems).values(item).returning();
    return result[0];
  }

  async updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    const result = await this.db.update(mediaItems)
      .set(item)
      .where(eq(mediaItems.id, id))
      .returning();
    return result[0];
  }

  async deleteMediaItem(id: number): Promise<boolean> {
    const result = await this.db.delete(mediaItems).where(eq(mediaItems.id, id)).returning();
    return result.length > 0;
  }

  // Promo Images
  async getPromoImages(activeOnly = false): Promise<PromoImage[]> {
    if (activeOnly) {
      return await this.db.select().from(promoImages)
        .where(eq(promoImages.is_active, true))
        .orderBy(asc(promoImages.order_index));
    }
    
    return await this.db.select().from(promoImages)
      .orderBy(asc(promoImages.order_index));
  }

  async createPromoImage(image: InsertPromoImage): Promise<PromoImage> {
    const result = await this.db.insert(promoImages).values(image).returning();
    return result[0];
  }

  async updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined> {
    const result = await this.db.update(promoImages)
      .set(image)
      .where(eq(promoImages.id, id))
      .returning();
    return result[0];
  }

  async deletePromoImage(id: number): Promise<boolean> {
    const result = await this.db.delete(promoImages).where(eq(promoImages.id, id)).returning();
    return result.length > 0;
  }

  // Banner Settings
  async getBannerSettings(): Promise<BannerSettings | undefined> {
    const banner = await this.db.select().from(bannerSettings)
      .where(eq(bannerSettings.is_active, true))
      .orderBy(desc(bannerSettings.created_date))
      .limit(1);
    return banner[0];
  }

  async createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings> {
    const result = await this.db.insert(bannerSettings).values(banner).returning();
    return result[0];
  }

  async updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined> {
    const result = await this.db.update(bannerSettings)
      .set(banner)
      .where(eq(bannerSettings.id, id))
      .returning();
    return result[0];
  }
}

// In-memory implementation for development or when DB is not configured
class InMemoryStorage implements IStorage {
  private rates: GoldRate[] = [];
  private settings: DisplaySettings | undefined = undefined;
  private media: MediaItem[] = [];
  private promos: PromoImage[] = [];
  private banner: BannerSettings | undefined = undefined;

  // Gold Rates
  async getCurrentRates(): Promise<GoldRate | undefined> {
    return this.rates[this.rates.length - 1];
  }
  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    const newItem: GoldRate = {
      id: (this.rates.at(-1)?.id || 0) + 1,
      ...rate,
      is_active: rate.is_active ?? true,
      created_date: new Date(),
    };
    // Deactivate previous
    this.rates = this.rates.map(r => ({ ...r, is_active: false }));
    this.rates.push(newItem);
    return newItem;
  }
  async updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined> {
    const idx = this.rates.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    const updated = { ...this.rates[idx], ...rate };
    this.rates[idx] = updated as GoldRate;
    return this.rates[idx];
  }

  // Display Settings
  async getDisplaySettings(): Promise<DisplaySettings | undefined> {
    return this.settings;
  }
  async createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings> {
    const newItem: DisplaySettings = {
      id: 1,
      orientation: settings.orientation ?? "horizontal",
      background_color: settings.background_color ?? "#FFF8E1",
      text_color: settings.text_color ?? "#212529",
      rate_number_font_size: settings.rate_number_font_size ?? "text-4xl",
      show_media: settings.show_media ?? true,
      rates_display_duration_seconds: settings.rates_display_duration_seconds ?? 15,
      refresh_interval: settings.refresh_interval ?? 30,
      created_date: new Date(),
    };
    this.settings = newItem;
    return newItem;
  }
  async updateDisplaySettings(_id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined> {
    if (!this.settings) return undefined;
    this.settings = { ...this.settings, ...settings };
    return this.settings;
  }

  // Media Items
  async getMediaItems(activeOnly = false): Promise<MediaItem[]> {
    return activeOnly ? this.media.filter(m => m.is_active) : this.media;
  }
  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    const newItem: MediaItem = {
      id: (this.media.at(-1)?.id || 0) + 1,
      name: item.name,
      file_url: item.file_url,
      file_data: item.file_data,
      media_type: item.media_type,
      duration_seconds: item.duration_seconds ?? 30,
      order_index: item.order_index ?? 0,
      is_active: item.is_active ?? true,
      file_size: item.file_size,
      mime_type: item.mime_type,
      created_date: new Date(),
    };
    this.media.push(newItem);
    return newItem;
  }
  async updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    const idx = this.media.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    this.media[idx] = { ...this.media[idx], ...item } as MediaItem;
    return this.media[idx];
  }
  async deleteMediaItem(id: number): Promise<boolean> {
    const len = this.media.length;
    this.media = this.media.filter(m => m.id !== id);
    return this.media.length < len;
  }

  // Promo Images
  async getPromoImages(activeOnly = false): Promise<PromoImage[]> {
    return activeOnly ? this.promos.filter(p => p.is_active) : this.promos;
  }
  async createPromoImage(image: InsertPromoImage): Promise<PromoImage> {
    const newItem: PromoImage = {
      id: (this.promos.at(-1)?.id || 0) + 1,
      name: image.name,
      image_url: image.image_url,
      image_data: image.image_data,
      duration_seconds: image.duration_seconds ?? 5,
      transition_effect: image.transition_effect ?? "fade",
      order_index: image.order_index ?? 0,
      is_active: image.is_active ?? true,
      file_size: image.file_size,
      created_date: new Date(),
    };
    this.promos.push(newItem);
    return newItem;
  }
  async updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined> {
    const idx = this.promos.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.promos[idx] = { ...this.promos[idx], ...image } as PromoImage;
    return this.promos[idx];
  }
  async deletePromoImage(id: number): Promise<boolean> {
    const len = this.promos.length;
    this.promos = this.promos.filter(p => p.id !== id);
    return this.promos.length < len;
  }

  // Banner Settings
  async getBannerSettings(): Promise<BannerSettings | undefined> {
    return this.banner;
  }
  async createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings> {
    const newItem: BannerSettings = {
      id: 1,
      banner_image_url: banner.banner_image_url,
      banner_image_data: banner.banner_image_data,
      banner_height: banner.banner_height ?? 120,
      is_active: banner.is_active ?? true,
      created_date: new Date(),
    };
    this.banner = newItem;
    return newItem;
  }
  async updateBannerSettings(_id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined> {
    if (!this.banner) return undefined;
    this.banner = { ...this.banner, ...banner } as BannerSettings;
    return this.banner;
  }
}

// Export active storage depending on environment
export const storage: IStorage = db ? new PostgresStorage() : new InMemoryStorage();
