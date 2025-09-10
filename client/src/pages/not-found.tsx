import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Common Header - matches Mobile Control page */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-black p-4 flex justify-center">
        <img 
          src="/logo.png" 
          alt="Devi Jewellers Logo"
          className="h-40 w-[350px] object-contain"
        />
      </div>
      <div className="w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Did you forget to add the page to the router?
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
