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
// In routes.ts - Update the media upload endpoint
app.post("/api/media/upload", uploadMedia.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const createdItems = [];
    for (const file of files) {
      const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      const fileUrl = `/uploads/media/${file.filename}`;
      
      // Get the highest order index to place new items at the end
      const allMedia = await storage.getMediaItems(false);
      const highestOrder = allMedia.reduce((max, item) => 
        Math.max(max, item.order_index || 0), 0);
      
      const mediaItem = await storage.createMediaItem({
        name: file.originalname,
        file_url: fileUrl,
        media_type: mediaType,
        duration_seconds: parseInt(req.body.duration) || 30,
        order_index: highestOrder + 1,
        is_active: req.body.autoActivate === 'true',
        file_size: file.size,
        mime_type: file.mimetype
      });
      
      createdItems.push(mediaItem);
    }

    res.status(201).json(createdItems);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload media files" });
  }
});
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
