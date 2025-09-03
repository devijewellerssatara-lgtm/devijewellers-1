import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { mediaApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { MediaItem } from "@shared/schema";

export default function MediaManager() {
  const { toast } = useToast();
  const [uploadSettings, setUploadSettings] = useState({
    duration: 30,
    mediaType: "auto",
    autoActivate: true
  });

  // Get media items
  const { data: mediaItems = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/media"],
    queryFn: () => mediaApi.getAll()
  });

  // Upload mutation - FIXED
  const uploadMutation = useMutation({
    mutationFn: async ({ files, settings }: { files: File[]; settings: typeof uploadSettings }) => {
      // Convert File[] to FileList
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      const fileList = dataTransfer.files;
      
      return mediaApi.upload(fileList, {
        duration: settings.duration,
        autoActivate: settings.autoActivate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media files uploaded successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to upload media files: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<MediaItem> }) =>
      mediaApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media item updated successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update media item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: mediaApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media item deleted successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete media item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      uploadMutation.mutate({ files, settings: uploadSettings });
    }
  };

  const handleUpdateItem = (id: number, field: string, value: any) => {
    updateMutation.mutate({ id, updates: { [field]: value } });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ... rest of the component remains the same until the return statement

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-video text-white text-xl"></i>
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900">DEVI JEWELLERS</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Media Manager</h2>
          <p className="text-gray-600">Upload and manage promotional videos and images for TV ads</p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-cloud-upload-alt mr-2"></i>Upload New Media
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                onDrop={handleFileUpload}
                accept="image/*,video/*"
                multiple={true}
                data-testid="media-upload-dropzone"
              >
                <div>
                  <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                  <p className="text-lg font-semibold text-gray-700">Drop files here or click to upload</p>
                  <p className="text-gray-500 mb-4">Support for images (JPG, PNG) and videos (MP4, AVI)</p>
                  {uploadMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  )}
                </div>
              </FileUpload>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Duration (seconds)</label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    value={uploadSettings.duration}
                    onChange={(e) => setUploadSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    data-testid="input-default-duration"
                  />
                </div>
                
                {/* Remove mediaType selection as it's handled automatically */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auto Activate</label>
                  <Select 
                    value={uploadSettings.autoActivate.toString()} 
                    onValueChange={(value) => setUploadSettings(prev => ({ ...prev, autoActivate: value === "true" }))}
                  >
                    <SelectTrigger data-testid="select-auto-activate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes, activate immediately</SelectItem>
                      <SelectItem value="false">No, keep inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ... rest of the component remains the same */}
      </div>
    </div>
  );
}
