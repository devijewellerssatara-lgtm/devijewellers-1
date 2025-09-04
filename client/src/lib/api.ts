import type { 
  GoldRate, 
  InsertGoldRate, 
  DisplaySettings, 
  InsertDisplaySettings,
  MediaItem,
  PromoImage,
  BannerSettings 
} from "@shared/schema";

// Helper function for API requests
const apiRequest = async (method: string, url: string, data?: any): Promise<Response> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}):`, errorText);
    
    // Try to parse error as JSON, otherwise use text
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response;
};

// Gold Rates API
export const ratesApi = {
  getCurrent: async (): Promise<GoldRate | null> => {
    const response = await apiRequest("GET", "/api/rates/current");
    return response.json();
  },

  create: async (rates: InsertGoldRate): Promise<GoldRate> => {
    const response = await apiRequest("POST", "/api/rates", rates);
    return response.json();
  }
};

// Display Settings API - Improved Error Handling
export const settingsApi = {
  getDisplay: async (): Promise<DisplaySettings | null> => {
    try {
      const response = await apiRequest("GET", "/api/settings/display");
      const data = await response.json();

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return data as DisplaySettings;
    } catch (error: any) {
      console.error("Failed to fetch display settings:", error);
      return null;
    }
  },

  createDisplay: async (settings: InsertDisplaySettings): Promise<DisplaySettings> => {
    const response = await apiRequest("POST", "/api/settings/display", settings);
    return (await response.json()) as DisplaySettings;
  },

  updateDisplay: async (id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings> => {
    if (!id || isNaN(id)) {
      throw new Error("Invalid settings ID");
    }
    const response = await apiRequest("PUT", `/api/settings/display/${id}`, settings);
    return (await response.json()) as DisplaySettings;
  }
};
// Media API
export const mediaApi = {
  getAll: async (activeOnly = false): Promise<MediaItem[]> => {
    const response = await apiRequest("GET", `/api/media?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration_seconds: number; autoActivate: boolean }): Promise<MediaItem[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('duration_seconds', options.duration_seconds.toString());
    formData.append('autoActivate', options.autoActivate.toString());

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
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
    const response = await apiRequest("GET", `/api/promo?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration_seconds: number; transition: string; autoActivate: boolean }): Promise<PromoImage[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('duration_seconds', options.duration_seconds.toString());
    formData.append('transition', options.transition);
    formData.append('autoActivate', options.autoActivate.toString());

    const response = await fetch("/api/promo/upload", {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
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
    const response = await apiRequest("GET", "/api/banner");
    return response.json();
  },

  upload: async (file: File): Promise<{ banner_image_url: string; message: string }> => {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await fetch("/api/banner/upload", {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
  }
};

// System API
export const systemApi = {
  getInfo: async () => {
    const response = await apiRequest("GET", "/api/system/info");
    return response.json();
  }
};
