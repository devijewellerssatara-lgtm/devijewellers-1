import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ratesApi, settingsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function CurrentRate() {
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

  const theme = {
    background: settings?.background_color || "#FFF8E1",
    text: settings?.text_color || "#212529",
    rateFontSize: settings?.rate_number_font_size || "text-4xl",
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

  const lastUpdated = currentRates.created_date
    ? format(new Date(currentRates.created_date), "EEE dd-MMM-yyyy HH:mm")
    : "Never";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-black px-3 py-2 flex justify-center items-center shadow-md">
        <img
          src="/logo.png"
          alt="Devi Jewellers Logo"
          className="h-16 md:h-20 w-[220px] md:w-[300px] object-contain"
        />
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Page Title */}
        <Card className="border border-gray-200 shadow-md">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg md:text-2xl font-bold text-gray-900">
                Current Rates
              </span>
              <span className="text-xs md:text-sm text-gray-600">
                Last Updated: {lastUpdated}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="sale" className="w-full">
              <TabsList className="bg-gold-50">
                <TabsTrigger value="sale">Sale</TabsTrigger>
                <TabsTrigger value="purchase">Purchase</TabsTrigger>
              </TabsList>

              <TabsContent value="sale" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <RateCard
                    title="24K GOLD (Per 10 gms)"
                    value={currentRates.gold_24k_sale}
                    rateFontSize={theme.rateFontSize}
                  />
                  <RateCard
                    title="22K GOLD (Per 10 gms)"
                    value={currentRates.gold_22k_sale}
                    rateFontSize={theme.rateFontSize}
                  />
                  <RateCard
                    title="18K GOLD (Per 10 gms)"
                    value={currentRates.gold_18k_sale}
                    rateFontSize={theme.rateFontSize}
                  />
                  <RateCard
                    title="SILVER (Per KG)"
                    value={currentRates.silver_per_kg_sale}
                    rateFontSize={theme.rateFontSize}
                  />
                </div>
              </TabsContent>

              <TabsContent value="purchase" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <RateCard
                    title="24K GOLD (Per 10 gms)"
                    value={currentRates.gold_24k_purchase}
                    rateFontSize={theme.rateFontSize}
                  />
                  <RateCard
                    title="22K GOLD (Per 10 gms)"
                    value={currentRates.gold_22k_purchase}
                    rateFontSize={theme.rateFontSize}
                  />
                  <RateCard
                    title="18K GOLD (Per 10 gms)"
                    value={currentRates.gold_18k_purchase}
                    rateFontSize={theme.rateFontSize}
                  />
                  <RateCard
                    title="SILVER (Per KG)"
                    value={currentRates.silver_per_kg_purchase}
                    rateFontSize={theme.rateFontSize}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RateCard({
  title,
  value,
  rateFontSize,
}: {
  title: string;
  value: number | string;
  rateFontSize: string;
}) {
  return (
    <div className="flex-1 bg-white w-full border border-gray-200 flex flex-col shadow-sm rounded-lg">
      <div className="flex items-center justify-between w-full px-3 py-2">
        <h4 className="text-sm md:text-xl font-semibold text-gray-900">{title}</h4>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center shadow-md">
          <i className="fas fa-rupee-sign text-white text-sm md:text-base"></i>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className={`${rateFontSize} font-extrabold text-blue-900 leading-tight drop-shadow-md`}>
          ₹{value}
        </p>
      </div>
    </div>
  );
}