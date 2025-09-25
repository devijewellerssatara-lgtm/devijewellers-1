import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ratesApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { insertGoldRateSchema } from "@shared/schema";

// Create a custom schema that converts strings to numbers
const goldRateFormSchema = insertGoldRateSchema.extend({
  gold_24k_sale: z.coerce.number().min(0),
  gold_24k_purchase: z.coerce.number().min(0),
  gold_22k_sale: z.coerce.number().min(0),
  gold_22k_purchase: z.coerce.number().min(0),
  gold_18k_sale: z.coerce.number().min(0),
  gold_18k_purchase: z.coerce.number().min(0),
  silver_per_kg_sale: z.coerce.number().min(0),
  silver_per_kg_purchase: z.coerce.number().min(0),
});

export default function MobileControl() {
  const { toast } = useToast();

  // Get current rates
  const { data: currentRates, isLoading } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent
  });

  // Percentage settings (purchase = sale - (sale * pct/100))
  const [purchasePerc, setPurchasePerc] = useState({
    k24: 0,
    k22: 0,
    k18: 0,
    silverKg: 0,
  });

  // Form setup with custom schema
  const form = useForm<z.infer<typeof goldRateFormSchema>>({
    resolver: zodResolver(goldRateFormSchema),
    defaultValues: {
      gold_24k_sale: currentRates?.gold_24k_sale ?? 0,
      gold_24k_purchase: currentRates?.gold_24k_purchase ?? 0,
      gold_22k_sale: currentRates?.gold_22k_sale ?? 0,
      gold_22k_purchase: currentRates?.gold_22k_purchase ?? 0,
      gold_18k_sale: currentRates?.gold_18k_sale ?? 0,
      gold_18k_purchase: currentRates?.gold_18k_purchase ?? 0,
      silver_per_kg_sale: currentRates?.silver_per_kg_sale ?? 0,
      silver_per_kg_purchase: currentRates?.silver_per_kg_purchase ?? 0,
      is_active: true,
    }
  });

  // Helper: recompute purchase rates based on current sale rates and percentage
  const recomputePurchases = () => {
    const s24 = Number(form.getValues("gold_24k_sale")) || 0;
    const s22 = Number(form.getValues("gold_22k_sale")) || 0;
    const s18 = Number(form.getValues("gold_18k_sale")) || 0;
    const sAg = Number(form.getValues("silver_per_kg_sale")) || 0;

    const p24 = Math.round(s24 * (1 - (purchasePerc.k24 || 0) / 100));
    const p22 = Math.round(s22 * (1 - (purchasePerc.k22 || 0) / 100));
    const p18 = Math.round(s18 * (1 - (purchasePerc.k18 || 0) / 100));
    const pAg = Math.round(sAg * (1 - (purchasePerc.silverKg || 0) / 100));

    form.setValue("gold_24k_purchase", p24);
    form.setValue("gold_22k_purchase", p22);
    form.setValue("gold_18k_purchase", p18);
    form.setValue("silver_per_kg_purchase", pAg);
  };

  // Update rates mutation
  const updateRatesMutation = useMutation({
    mutationFn: ratesApi.create,
    onSuccess: (result) => {
      console.log('Mutation successful:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
      toast({
        title: "Success",
        description: "Rates updated successfully! Changes will appear on TV display."
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update rates: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: z.infer<typeof goldRateFormSchema>) => {
    // Ensure purchase is computed before submit
    recomputePurchases();

    const submitData = {
      ...form.getValues(),
      is_active: true
    };
    
    console.log('Submitting data:', submitData);
    updateRatesMutation.mutate(submitData as z.infer<typeof goldRateFormSchema>);
  };

  // Update form values when current rates change
  React.useEffect(() => {
    if (currentRates) {
      form.reset({
        gold_24k_sale: currentRates.gold_24k_sale,
        gold_24k_purchase: currentRates.gold_24k_purchase,
        gold_22k_sale: currentRates.gold_22k_sale,
        gold_22k_purchase: currentRates.gold_22k_purchase,
        gold_18k_sale: currentRates.gold_18k_sale,
        gold_18k_purchase: currentRates.gold_18k_purchase,
        silver_per_kg_sale: currentRates.silver_per_kg_sale,
        silver_per_kg_purchase: currentRates.silver_per_kg_purchase,
        is_active: true
      });
    }
  }, [currentRates, form]);

  // Watch sale rate or percentage changes to auto recompute purchases
  React.useEffect(() => {
    const subscription = form.watch(() => {
      recomputePurchases();
    });
    return () => subscription.unsubscribe();
  }, [form, purchasePerc.k24, purchasePerc.k22, purchasePerc.k18, purchasePerc.silverKg]);

  // Fetch sales rates from external API and populate form
  const fetchSalesFromExternal = async () => {
    try {
      const resp = await fetch("https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php", {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      const data = await resp.json() as Record<string, number>;
      // Expected keys: "24K Gold", "22K Gold", "18K Gold", "Silver"
      const sale24 = Number(data["24K Gold"]) || 0; // per 10g
      const sale22 = Number(data["22K Gold"]) || 0; // per 10g
      const sale18 = Number(data["18K Gold"]) || 0; // per 10g
      const silverPer10g = Number(data["Silver"]) || 0; // per 10g -> convert to per kg
      const silverPerKg = Math.round(silverPer10g * 100); // 10g = 0.01kg, so multiply by 100

      form.setValue("gold_24k_sale", sale24);
      form.setValue("gold_22k_sale", sale22);
      form.setValue("gold_18k_sale", sale18);
      form.setValue("silver_per_kg_sale", silverPerKg);

      recomputePurchases();

      toast({
        title: "Fetched latest sales rates",
        description: "Sales rates populated from external API. Purchase rates auto-calculated.",
      });
    } catch (error: any) {
      console.error("Failed to fetch external sales rates:", error);
      toast({
        title: "Fetch failed",
        description: error?.message || "Unable to fetch sales rates from external API.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jewelry-primary/10 to-jewelry-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-jewelry-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-jewelry-primary/10 to-jewelry-secondary/10">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-black p-4 flex justify-center">
        <img 
          src="/logo.png" 
          alt="Devi Jewellers Logo"
          className="h-40 w-[350px] object-contain"
        />
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Status Card */}
        <Card className="border-l-4 border border-black">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Last Updated</h3>
                <p className="text-sm text-gray-600">
                  {currentRates?.created_date 
                    ? format(new Date(currentRates.created_date), "PPpp")
                    : "Never"
                  }
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Update Form */}
        <Card className="w-full bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-black py-4 text-lg border-2 border-black rounded-lg">
          <CardHeader className="bg-gradient-to-r from-gold-500 to-gold-600 text-black">
            <CardTitle className="flex items-center text-lg">
              Update Gold & Silver Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Fetch Sales Button + Percentage Settings */}
            <div className="mb-6 grid grid-cols-1 gap-3">
              <Button 
                type="button"
                onClick={fetchSalesFromExternal}
                className="w-full bg-gold-600 text-black border-2 border-black rounded-lg hover:bg-gold-700"
              >
                Fetch Sales Rates from External API
              </Button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium">24K Purchase %</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.1"
                    value={purchasePerc.k24}
                    onChange={(e) => setPurchasePerc(p => ({ ...p, k24: Number(e.target.value) }))}
                    className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">22K Purchase %</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.1"
                    value={purchasePerc.k22}
                    onChange={(e) => setPurchasePerc(p => ({ ...p, k22: Number(e.target.value) }))}
                    className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">18K Purchase %</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.1"
                    value={purchasePerc.k18}
                    onChange={(e) => setPurchasePerc(p => ({ ...p, k18: Number(e.target.value) }))}
                    className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Silver (KG) Purchase %</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.1"
                    value={purchasePerc.silverKg}
                    onChange={(e) => setPurchasePerc(p => ({ ...p, silverKg: Number(e.target.value) }))}
                    className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 24K Gold */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="text-gold-500 mr-2">★</span>24K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_24k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gold_24k_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate (auto)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              disabled
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold bg-gray-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 22K Gold */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="text-gold-600 mr-2">◆</span>22K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_22k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gold_22k_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate (auto)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              disabled
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold bg-gray-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 18K Gold */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="text-gold-700 mr-2">♦</span>18K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_18k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gold_18k_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate (auto)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              disabled
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold bg-gray-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Silver */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="text-gray-400 mr-2">●</span>Silver (Per KG)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="silver_per_kg_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="silver_per_kg_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate (auto)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              disabled
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold bg-gray-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-black py-4 text-lg border-2 border-black rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-colors duration-300"
                  disabled={updateRatesMutation.isPending}
                >
                  {updateRatesMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      Update Rates on TV Display
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Current Rates Display */}
        <Card className="w-full bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-black py-4 text-lg border-2 border-black rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              Currently Displayed Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xl">
              <div className="flex justify-between">
                <span>24K Gold Sale:</span>
                <span className="font-semibold border-2 border-black rounded-md px-2 py-1">₹{currentRates?.gold_24k_sale}</span>
              </div>
              <div className="flex justify-between">
                <span>22K Gold Sale:</span>
                <span className="font-semibold border-2 border-black rounded-md px-2 py-1">₹{currentRates?.gold_22k_sale}</span>
              </div>
              <div className="flex justify-between">
                <span>Silver Sale:</span>
                <span className="font-semibold border-2 border-black rounded-md px-2 py-1">₹{currentRates?.silver_per_kg_sale}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
