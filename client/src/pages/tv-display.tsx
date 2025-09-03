import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ratesApi, promoApi, mediaApi, bannerApi, settingsApi } from "@/lib/api";

export default function TVDisplay() {
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showingRates, setShowingRates] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 });

  // Data queries
  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    refetchInterval: 30000
  });

  const { data: mediaItems = [] } = useQuery({
    queryKey: ["/api/media"],
    queryFn: () => mediaApi.getAll(true),
    refetchInterval: 30000
  });

  const { data: promoImages = [] } = useQuery({
    queryKey: ["/api/promo"],
    queryFn: () => promoApi.getAll(true),
    refetchInterval: 30000
  });

  const { data: bannerSettings } = useQuery({
    queryKey: ["/api/banner"],
    queryFn: bannerApi.getCurrent,
    refetchInterval: 30000
  });

  // Effect for the live clock
  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Effect to detect screen size
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Effect for rotating between rates and media
  useEffect(() => {
    if (!settings?.show_media || mediaItems.length === 0) return;

    const ratesDisplayTime = (settings?.rates_display_duration || 15) * 1000;
    const currentMedia = mediaItems[currentMediaIndex];
    const mediaDisplayTime = (currentMedia?.duration_seconds || 30) * 1000;

    const interval = setInterval(() => {
      if (showingRates) {
        setShowingRates(false);
      } else {
        setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
        setShowingRates(true);
      }
    }, showingRates ? ratesDisplayTime : mediaDisplayTime);

    return () => clearInterval(interval);
  }, [showingRates, currentMediaIndex, mediaItems, settings]);

  // Effect for the promotional image slideshow
  useEffect(() => {
    if (promoImages.length <= 1) return;

    const currentPromo = promoImages[currentPromoIndex];
    const duration = (currentPromo?.duration_seconds || 5) * 1000;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoImages.length);
    }, duration);

    return () => clearInterval(interval);
  }, [currentPromoIndex, promoImages]);

  // Reset indices when arrays change
  useEffect(() => {
    if (mediaItems.length > 0 && currentMediaIndex >= mediaItems.length) {
      setCurrentMediaIndex(0);
    }
  }, [mediaItems, currentMediaIndex]);

  useEffect(() => {
    if (promoImages.length > 0 && currentPromoIndex >= promoImages.length) {
      setCurrentPromoIndex(0);
    }
  }, [promoImages, currentPromoIndex]);

  const isVertical = settings?.orientation === "vertical";
  const rateFontSize = settings?.rate_number_font_size || "text-4xl";
  
  // Responsive font sizes based on screen width
  const getResponsiveFontSize = (baseSize: string) => {
    if (screenSize.width < 768) {
      return baseSize.replace('text-', 'text-sm-').replace('xl', '');
    }
    if (screenSize.width < 1024) {
      return baseSize.replace('text-', 'text-md-');
    }
    return baseSize;
  };

  const currentPromo = promoImages[currentPromoIndex];

  if (!currentRates) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-jewelry-primary to-jewelry-secondary">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-semibold">Loading Rates...</p>
        </div>
      </div>
    );
  }

  const currentMedia = mediaItems[currentMediaIndex];

  return (
    <div 
      className="w-full h-screen overflow-hidden flex flex-col"
      style={{ 
        backgroundColor: settings?.background_color || "#FFF8E1",
        color: settings?.text_color || "#212529",
        fontSize: screenSize.width < 768 ? '12px' : '16px'
      }}
    >
      <AnimatePresence mode="wait">
        {showingRates ? (
          <motion.div
            key="rates"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {/* Header with Company Logo */}
            <div className="relative bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-white py-2 md:py-4 flex-shrink-0">
              <div className="container mx-auto px-2 md:px-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div className="w-8 h-8 md:w-16 md:h-16 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                    <i className="fas fa-gem text-sm md:text-2xl text-white"></i>
                  </div>
                  <div>
                    <h1 className="text-lg md:text-3xl font-display font-bold tracking-wide">DEVI JEWELLERS</h1>
                    <p className="text-gold-200 text-xs md:text-sm">Premium Gold & Silver Collection</p>
                  </div>
                </div>
                
                {/* Date and Time */}
                <div className="text-right bg-black bg-opacity-30 px-3 md:px-6 py-1 md:py-3 rounded-lg backdrop-blur-sm">
                  <div className="text-xs md:text-lg font-semibold text-gold-200">
                    {format(currentTime, "EEEE dd-MMM-yyyy")}
                  </div>
                  <div className="text-sm md:text-2xl font-bold text-white">
                    {format(currentTime, "HH:mm:ss")}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Rate Header */}
            <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white py-2 md:py-3 text-center flex-shrink-0">
              <h2 className="text-lg md:text-3xl font-display font-bold">TODAY'S RATES</h2>
            </div>

            {/* Rates Display - Main Content */}
            <div className="flex-1 container mx-auto px-2 md:px-6 py-2 md:py-8 min-h-0 overflow-auto">
              <div className={`grid gap-4 md:gap-8 h-full ${isVertical ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {/* Gold Rates */}
                <div className="space-y-3 md:space-y-6">
                  <h3 className="text-base md:text-2xl font-display font-bold text-center text-jewelry-primary mb-3 md:mb-6">GOLD RATES (Per 10 GMS)</h3>
                  
                  {/* 24K Gold */}
                  <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-lg md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-gold-500">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                      <h4 className="text-base md:text-2xl font-bold text-gray-800">24K GOLD</h4>
                      <div className="w-6 h-6 md:w-10 md:h-10 bg-gold-500 rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-star text-white text-xs md:text-base"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded md:rounded-lg border border-blue-200">
                        <p className="text-xs md:text-sm text-blue-600 font-semibold mb-1">SALE RATE</p>
                        <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-blue-800`}>₹{currentRates.gold_24k_sale}</p>
                      </div>
                      <div className="text-center p-2 md:p-4 bg-jewelry-accent bg-opacity-10 rounded md:rounded-lg border border-jewelry-accent border-opacity-30">
                        <p className="text-xs md:text-sm text-jewelry-accent font-semibold mb-1">PURCHASE RATE</p>
                        <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-jewelry-accent`}>₹{currentRates.gold_24k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 22K Gold */}
                  <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-lg md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-gold-600">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                      <h4 className="text-base md:text-2xl font-bold text-gray-800">22K GOLD</h4>
                      <div className="w-6 h-6 md:w-10 md:h-10 bg-gold-600 rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-medal text-white text-xs md:text-base"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded md:rounded-lg border border-blue-200">
                        <p className="text-xs md:text-sm text-blue-600 font-semibold mb-1">SALE RATE</p>
                        <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-blue-800`}>₹{currentRates.gold_22k_sale}</p>
                      </div>
                      <div className="text-center p-2 md:p-4 bg-jewelry-accent bg-opacity-10 rounded md:rounded-lg border border-jewelry-accent border-opacity-30">
                        <p className="text-xs md:text-sm text-jewelry-accent font-semibold mb-1">PURCHASE RATE</p>
                        <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-jewelry-accent`}>₹{currentRates.gold_22k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 18K Gold */}
                  <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-lg md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-gold-700">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                      <h4 className="text-base md:text-2xl font-bold text-gray-800">18K GOLD</h4>
                      <div className="w-6 h-6 md:w-10 md:h-10 bg-gold-700 rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-crown text-white text-xs md:text-base"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded md:rounded-lg border border-blue-200">
                        <p className="text-xs md:text-sm text-blue-600 font-semibold mb-1">SALE RATE</p>
                        <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-blue-800`}>₹{currentRates.gold_18k_sale}</p>
                      </div>
                      <div className="text-center p-2 md:p-4 bg-jewelry-accent bg-opacity-10 rounded md:rounded-lg border border-jewelry-accent border-opacity-30">
                        <p className="text-xs md:text-sm text-jewelry-accent font-semibold mb-1">PURCHASE RATE</p>
                        <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-jewelry-accent`}>₹{currentRates.gold_18k_purchase}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Silver Rates & Promo Column */}
                <div className="space-y-3 md:space-y-6">
                  {/* Silver Rates */}
                  <div>
                    <h3 className="text-base md:text-2xl font-display font-bold text-center text-jewelry-primary mb-3 md:mb-6">SILVER RATES (Per KG)</h3>
                    
                    <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-lg md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-gray-400">
                      <div className="flex justify-between items-center mb-2 md:mb-4">
                        <h4 className="text-base md:text-2xl font-bold text-gray-800">SILVER</h4>
                        <div className="w-6 h-6 md:w-10 md:h-10 bg-gray-400 rounded-full shadow-lg flex items-center justify-center">
                          <i className="fas fa-circle text-white text-xs md:text-base"></i>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:gap-4">
                        <div className="text-center p-2 md:p-4 bg-blue-50 rounded md:rounded-lg border border-blue-200">
                          <p className="text-xs md:text-sm text-blue-600 font-semibold mb-1">SALE RATE</p>
                          <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-blue-800`}>₹{currentRates.silver_per_kg_sale}</p>
                        </div>
                        <div className="text-center p-2 md:p-4 bg-jewelry-accent bg-opacity-10 rounded md:rounded-lg border border-jewelry-accent border-opacity-30">
                          <p className="text-xs md:text-sm text-jewelry-accent font-semibold mb-1">PURCHASE RATE</p>
                          <p className={`${getResponsiveFontSize(rateFontSize)} font-bold text-jewelry-accent`}>₹{currentRates.silver_per_kg_purchase}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promotional Slideshow */}
                  {promoImages.length > 0 && (
                    <div className="bg-white rounded-lg md:rounded-xl shadow-lg md:shadow-xl overflow-hidden flex-1">
                      <div className="relative aspect-video bg-gradient-to-br from-gold-100 to-gold-200 h-full">
                        {currentPromo && (
                          <img
                            key={currentPromo.id}
                            src={currentPromo.image_url}
                            alt={currentPromo.name || "Promotional Image"}
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Slideshow Indicators */}
                        {promoImages.length > 1 && (
                          <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 md:space-x-2">
                            {promoImages.map((_, index) => (
                              <div
                                key={index}
                                className={`w-1 h-1 md:w-2 md:h-2 rounded-full transition-colors ${
                                  index === currentPromoIndex ? 'bg-jewelry-primary' : 'bg-gray-400'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Banner */}
            {bannerSettings?.banner_image_url && (
              <div 
                className="flex-shrink-0 bg-white border-t-2 md:border-t-4 border-jewelry-primary shadow-lg"
                style={{ 
                  height: `${Math.min(bannerSettings.banner_height || 120, screenSize.height * 0.15)}px`
                }}
              >
                <div className="h-full flex items-center justify-center p-1 md:p-2">
                  <img 
                    src={bannerSettings.banner_image_url} 
                    alt="Banner" 
                    className="max-h-full max-w-full object-contain rounded md:rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          currentMedia && (
            <motion.div
              key={`media-${currentMediaIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full flex items-center justify-center bg-black"
            >
              {currentMedia.media_type === "image" ? (
                <img 
                  src={currentMedia.file_url} 
                  alt={currentMedia.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video 
                  src={currentMedia.file_url} 
                  autoPlay 
                  muted 
                  className="max-w-full max-h-full object-contain"
                  playsInline
                />
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
