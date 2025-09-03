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

export default function MobileControl() {
  const { toast } = useToast();

  // Get current rates
  const { data: currentRates, isLoading } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent
  });

  // Form setup
  const form = useForm<z.infer<typeof insertGoldRateSchema>>({
    resolver: zodResolver(insertGoldRateSchema),
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

  // Update rates mutation
  const updateRatesMutation = useMutation({
    mutationFn: ratesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
      toast({
        title: "Success",
        description: "Rates updated successfully! Changes will appear on TV display."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update rates. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: z.infer<typeof insertGoldRateSchema>) => {
    updateRatesMutation.mutate(data);
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
      <div className="mobile-nav text-white p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center">
            <i className="fas fa-gem text-white"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold">DEVI JEWELLERS</h1>
            <p className="text-gold-200 text-sm">Rate Control Panel</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Status Card */}
        <Card className="border-l-4 border-jewelry-accent">
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
              <div className="w-3 h-3 bg-jewelry-accent rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Update Form */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-gold-500 to-gold-600 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-coins mr-2"></i>
              Update Gold & Silver Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 24K Gold */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-star text-gold-500 mr-2"></i>24K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_24k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-gold-24k-sale" />
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
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-gold-24k-purchase" />
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
                    <i className="fas fa-medal text-gold-600 mr-2"></i>22K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_22k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-gold-22k-sale" />
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
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-gold-22k-purchase" />
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
                    <i className="fas fa-crown text-gold-700 mr-2"></i>18K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_18k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-gold-18k-sale" />
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
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-gold-18k-purchase" />
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
                    <i className="fas fa-circle text-gray-400 mr-2"></i>Silver (Per KG)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="silver_per_kg_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-silver-sale" />
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
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-silver-purchase" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-white py-4 text-lg"
                  disabled={updateRatesMutation.isPending}
                  data-testid="button-update-rates"
                >
                  {updateRatesMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Update Rates on TV Display
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Current Rates Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-eye text-blue-500 mr-2"></i>
              Currently Displayed Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between" data-testid="display-gold-24k-sale">
                <span>24K Gold Sale:</span>
                <span className="font-semibold text-blue-600">₹{currentRates?.gold_24k_sale}</span>
              </div>
              <div className="flex justify-between" data-testid="display-gold-22k-sale">
                <span>22K Gold Sale:</span>
                <span className="font-semibold text-blue-600">₹{currentRates?.gold_22k_sale}</span>
              </div>
              <div className="flex justify-between" data-testid="display-silver-sale">
                <span>Silver Sale:</span>
                <span className="font-semibold text-blue-600">₹{currentRates?.silver_per_kg_sale}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
