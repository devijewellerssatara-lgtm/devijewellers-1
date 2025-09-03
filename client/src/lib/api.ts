import { apiRequest } from "./queryClient";
import type { 
  GoldRate, 
  InsertGoldRate, 
  DisplaySettings, 
  InsertDisplaySettings,
  MediaItem,
  PromoImage,
  BannerSettings 
} from "@shared/schema";

// Gold Rates API
export const ratesApi = {
  getCurrent: async (): Promise<GoldRate | null> => {
    const response = await fetch("/api/rates/current");
    return response.json();
  },

  create: async (rates: InsertGoldRate): Promise<GoldRate> => {
    const response = await apiRequest("POST", "/api/rates", rates);
    return response.json();
  }
};

// Display Settings API
export const settingsApi = {
  getDisplay: async (): Promise<DisplaySettings> => {
    const response = await fetch("/api/settings/display");
    return response.json();
  },

  createDisplay: async (settings: InsertDisplaySettings): Promise<DisplaySettings> => {
    const response = await apiRequest("POST", "/api/settings/display", settings);
    return response.json();
  },

  updateDisplay: async (id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings> => {
    const response = await apiRequest("PUT", `/api/settings/display/${id}`, settings);
    return response.json();
  }
};
// Media API
export const mediaApi = {
  getAll: async (activeOnly = false): Promise<MediaItem[]> => {
    const response = await fetch(`/api/media?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration: number; autoActivate: boolean }): Promise<MediaItem[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('duration', options.duration.toString());
    formData.append('autoActivate', options.autoActivate.toString());

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData
    });
    return response.json();
  },

  update: async (id: number, updates: Partial<MediaItem>): Promise<MediaItem> => {
    const response = await apiRequest("PUT", `/api/media/${id}`, updates);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/media/${id}`);
  }
};

// Promo API
export const promoApi = {
  getAll: async (activeOnly = false): Promise<PromoImage[]> => {
    const response = await fetch(`/api/promo?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration: number; transition: string; autoActivate: boolean }): Promise<PromoImage[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('duration', options.duration.toString());
    formData.append('transition', options.transition);
    formData.append('autoActivate', options.autoActivate.toString());

    const response = await fetch("/api/promo/upload", {
      method: "POST",
      body: formData
    });
    return response.json();
  },

  update: async (id: number, updates: Partial<PromoImage>): Promise<PromoImage> => {
    const response = await apiRequest("PUT", `/api/promo/${id}`, updates);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/promo/${id}`);
  }
};

// Banner API
export const bannerApi = {
  getCurrent: async (): Promise<BannerSettings | null> => {
    const response = await fetch("/api/banner");
    return response.json();
  },

  upload: async (file: File): Promise<{ banner_image_url: string; message: string }> => {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await fetch("/api/banner/upload", {
      method: "POST",
      body: formData
    });
    return response.json();
  }
};

// System API
export const systemApi = {
  getInfo: async () => {
    const response = await fetch("/api/system/info");
    return response.json();
  }
};
