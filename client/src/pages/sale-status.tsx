import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ratesApi, settingsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function SaleStatus() {
  // Keep time in India timezone
  const getIndianTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  };

  const [currentTime, setCurrentTime] = useState<Date>(getIndianTime());
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState<"idle" | "saving" | "sharing">("idle");

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

  // Explicit 9:16 capture size improves Android reliability
  const CAPTURE_WIDTH = 720; // px
  const CAPTURE_HEIGHT = 1280; // px

  // Generate PNG and keep it for reuse (improves sharing reliability on Android)
  const generateImage = async (): Promise<{ blob: Blob; url: string } | null> => {
    if (!captureRef.current) return null;
    const node = captureRef.current;

    // Ensure capture node has explicit size (no transform/padding hacks)
    node.style.width = `${CAPTURE_WIDTH}px`;
    node.style.height = `${CAPTURE_HEIGHT}px`;

    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: theme.background,
      style: {
        transform: "none",
      },
    });

    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    return { blob, url };
  };

  const handleSaveImage = async () => {
    try {
      setIsWorking("saving");
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image");

      // Trigger download
      const a = document.createElement("a");
      a.href = generated.url;
      a.download = `rates-status-${format(currentTime, "yyyyMMdd-HHmm")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Android sometimes ignores download attribute; open the image as fallback
      try {
        window.open(generated.url, "_blank");
      } catch {}
    } catch (e) {
      console.error("Failed to export image", e);
      alert("Failed to save image. On Android, please ensure you're using Chrome or a modern browser.");
    } finally {
      setIsWorking("idle");
    }
  };

  // Share to WhatsApp: always generate snapshot first, then use native share with image file
  const handleShareWhatsApp = async () => {
    try {
      setIsWorking("sharing");

      // Always generate a fresh image (snapshot first)
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image for sharing");
      const { blob } = generated;

      // Native share with image file only
      // @ts-expect-error
      if (navigator?.share) {
        const file = new File(
          [blob],
          `rates-status-${format(currentTime, "yyyyMMdd-HHmm")}.png`,
          { type: "image/png" }
        );

        // Some vendors require a title, but keep payload strictly as file
        try {
          // @ts-expect-error
          await navigator.share({ files: [file], title: "Today's Sale Rates" });
          return;
        } catch (err) {
          console.error("Native share rejected", err);
          throw err;
        }
      } else {
        throw new Error("Native share not supported on this browser.");
      }
    } catch (e) {
      console.error("Share failed", e);
      alert("Native image sharing is not supported on this browser. Please use Chrome on Android or Safari 16.4+ on iOS.");
    } finally {
      setIsWorking("idle");
    }
  };

  const buildTextSummary = (rates: any, time: Date) => {
    if (!rates) {
      return `Today's Gold & Silver sale rates.\n${format(
        time,
        "EEEE, dd MMM yyyy • HH:mm"
      )} (IST)`;
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
      <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-black p-3 md:p-4 flex justify-center">
        <img
          src="/logo.png"
          alt="Devi Jewellers Logo"
          className="h-24 md:h-40 w-[260px] md:w-[350px] object-contain"
        />
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24">
        {/* Date + Day under the page header */}
        <div className="text-center mb-4">
          <div className="inline-block bg-white/70 backdrop-blur rounded-lg px-4 py-2 shadow-sm">
            <div className="text-sm text-gray-600">{format(currentTime, "EEEE")}</div>
            <div className="text-base font-semibold text-gray-800">
              {format(currentTime, "dd MMM yyyy")} • {format(currentTime, "HH:mm:ss")}
            </div>
          </div>
        </div>

        {/* 9:16 capture area - explicit size for Android reliability */}
        <div className="mx-auto mb-4" style={{ maxWidth: 360 }}>
          {/* Visual scale wrapper so it fits on smaller screens while keeping captureRef explicit px size */}
          <div className="relative w-full" style={{ paddingTop: `${(16 / 9) * 100}%` }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                ref={captureRef}
                className="rounded-xl shadow-lg overflow-hidden flex flex-col border border-black/10"
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  width: `${CAPTURE_WIDTH}px`,
                  height: `${CAPTURE_HEIGHT}px`,
                  // Scale down to fit container while keeping true pixel size for capture
                  transformOrigin: "top left",
                  transform: "scale(calc((min(100%, 360px)) / 720))",
                }}
              >
                {/* Branded header inside the image */}
                <div className="bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-white py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                      <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-gold-200 text-xs">Premium Gold & Silver Collection</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gold-200">
                      {format(currentTime, "EEEE dd-MMM-yyyy")}
                    </div>
                    <div className="text-sm font-bold text-white">{format(currentTime, "HH:mm")}</div>
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
            </div>
          </div>
        </div>

        {/* Spacer to ensure content doesn’t collide with sticky action bar */}
        <div className="h-20 md:h-0" />

        {/* Preview on mobile if needed (above action bar to avoid overlap) */}
        {imageUrl && (
          <div className="text-center mt-4 mb-4">
            <p className="text-xs text-gray-600 mb-2">Preview (for reference):</p>
            <img
              src={imageUrl}
              alt="Generated status"
              className="mx-auto max-w-[360px] rounded-lg border"
            />
          </div>
        )}
      </div>

      {/* Sticky Action Bar - stays above any overlapping content */}
      <div
        className="sticky bottom-0 z-40 w-full border-t"
        style={{ backgroundColor: theme.background, borderColor: "rgba(0,0,0,0.1)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
          <Button onClick={handleSaveImage} className="bg-jewelry-primary text-white" disabled={isWorking !== "idle"}>
            <i className="fas fa-download mr-2"></i>
            {isWorking === "saving" ? "Saving..." : "Save Image (9:16)"}
          </Button>
          <Button onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700 text-white" disabled={isWorking !== "idle"}>
            <i className="fab fa-whatsapp mr-2"></i>
            {isWorking === "sharing" ? "Opening Share..." : "Share on WhatsApp"}
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