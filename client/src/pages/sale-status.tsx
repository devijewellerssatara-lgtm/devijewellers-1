import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ratesApi, settingsApi } from "@/lib/api";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";

export default function SaleStatus() {
  // Keep time in India timezone
  const getIndianTime = () => {
    const now = new Date();
    return new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
  };

  const [currentTime, setCurrentTime] = useState<Date>(getIndianTime());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getIndianTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    refetchInterval: 30000,
  });

  const captureRef = useRef<HTMLDivElement>(null);

  const theme = useMemo(() => {
    return {
      background: settings?.background_color || "#FFF8E1",
      text: settings?.text_color || "#212529",
      rateSize: settings?.rate_number_font_size || "text-4xl",
    };
  }, [settings]);

  // Export node as image
  const handleSaveImage = async () => {
    if (!captureRef.current) return;
    try {
      const node = captureRef.current;
      const { toPng } = await import("html-to-image");
      // Force higher pixel ratio for crisp status
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: theme.background,
      });

      // Try download first
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `rates-status-${format(currentTime, "yyyyMMdd-HHmm")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Also open in a new tab as a fallback (helps on some mobile browsers)
      try {
        window.open(dataUrl, "_blank");
      } catch {}
    } catch (e) {
      console.error("Failed to export image", e);
      alert("Failed to save image. Please try again. On iPhone, tap and hold the image to save.");
    }
  };

  // Share to WhatsApp via Web Share API with image if available, otherwise provide a manual fallback
  const handleShareWhatsApp = async () => {
    if (!captureRef.current) return;

    // Build a plain text summary as a fallback
    const textSummary = buildTextSummary(currentRates, currentTime);

    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(captureRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: theme.background,
      });

      if (blob) {
        // Prefer Web Share API with files (Android Chrome, iOS Safari 16.4+)
        // @ts-expect-error
        if (navigator?.canShare && navigator?.share) {
          const file = new File(
            [blob],
            `rates-status-${format(currentTime, "yyyyMMdd-HHmm")}.png`,
            { type: "image/png" }
          );
          // @ts-expect-error
          if (navigator.canShare?.({ files: [file] })) {
            // @ts-expect-error
            await navigator.share({ files: [file], text: textSummary });
            return;
          }
        }

        // Manual fallback: open image in a new tab for user to long-press and share to WhatsApp
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        alert("Image opened. Long-press and share to WhatsApp. If it doesn't open, use Save Image and share from gallery.");
        return;
      }

      // If we couldn't create an image, fallback to WhatsApp text share URL
      const url = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
      window.open(url, "_blank");
    } catch (e) {
      console.error("Share failed", e);
      const url = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
      window.open(url, "_blank");
    }
  };

  const buildTextSummary = (
    rates: any,
    time: Date
  ) => {
    if (!rates) {
      return `Today's Gold & Silver sale rates.\n${format(time, "EEEE, dd MMM yyyy • HH:mm")} (IST)`;
    }
    return [
      "TODAY'S SALE RATES",
      `${format(time, "EEEE, dd MMM yyyy • HH:mm")} (IST)`,
      "",
      `24K GOLD (10g): ₹${rates.gold_24k_sale}`,
      `22K GOLD (10g): ₹${rates.gold_22k_sale}`,
      `18K GOLD (10g): ₹${rates.gold_18k_sale}`,
      `SILVER (1kg): ₹${rates.silver_per_kg_sale}`,
    ].join("\n");
  };

  if (!currentRates) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gold-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-jewelry-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-700">Loading current rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Mobile Control-like header (full-width banner with logo) */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-black p-4 flex justify-center">
        <img
          src="/logo.png"
          alt="Devi Jewellers Logo"
          className="h-40 w-[350px] object-contain"
        />
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Date + Day under the page header */}
        <div className="text-center mb-4">
          <div className="inline-block bg-white/70 backdrop-blur rounded-lg px-4 py-2 shadow-sm">
            <div className="text-sm text-gray-600">{format(currentTime, "EEEE")}</div>
            <div className="text-base font-semibold text-gray-800">
              {format(currentTime, "dd MMM yyyy")} • {format(currentTime, "HH:mm:ss")}
            </div>
          </div>
        </div>

        {/* 9:16 canvas area to capture */}
        <div className="mx-auto max-w-[480px]">
          <AspectRatio ratio={9 / 16}>
            <div
              ref={captureRef}
              className="w-full h-full rounded-xl shadow-lg overflow-hidden flex flex-col"
              style={{ backgroundColor: theme.background, color: theme.text }}
            >
              {/* Branded header inside the image */}
              <div className="bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-white py-3 px-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-gold-200 text-xs">Premium Gold & Silver Collection</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gold-200">
                    {format(currentTime, "EEEE dd-MMM-yyyy")}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {format(currentTime, "HH:mm")}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white text-center py-2">
                <h2 className="font-display font-bold text-xl">TODAY'S SALE RATES</h2>
              </div>

              {/* Rates only (sale) */}
              <div className="flex-1 p-4 space-y-3">
                <RateCard title="24K GOLD (Per 10 gms)" value={currentRates.gold_24k_sale} rateSize={theme.rateSize} />
                <RateCard title="22K GOLD (Per 10 gms)" value={currentRates.gold_22k_sale} rateSize={theme.rateSize} />
                <RateCard title="18K GOLD (Per 10 gms)" value={currentRates.gold_18k_sale} rateSize={theme.rateSize} />
                <RateCard title="SILVER (Per KG)" value={currentRates.silver_per_kg_sale} rateSize={theme.rateSize} />
              </div>

              {/* Footer note */}
              <div className="text-center text-[10px] text-gray-600 pb-2">
                Prices subject to market changes • {format(currentTime, "dd MMM yyyy")}
              </div>
            </div>
          </AspectRatio>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <Button onClick={handleSaveImage} className="bg-jewelry-primary text-white">
            <i className="fas fa-download mr-2"></i>
            Save Image (9:16)
          </Button>
          <Button onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
            <i className="fab fa-whatsapp mr-2"></i>
            Share on WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}

function RateCard({
  title,
  value,
  rateSize,
}: {
  title: string;
  value: number | string;
  rateSize: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow border-l-8 border-jewelry-primary p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <div className="w-8 h-8 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
          <i className="fas fa-rupee-sign text-white text-xs"></i>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className={`${rateSize} font-bold text-blue-800`}>₹{value}</p>
      </div>
    </div>
  );
}