import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { API_BASE_URL } from "../lib/api";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(5000, "Description too long").optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

export default function UploadModal({ isOpen, onClose, currentUser }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
      visibility: "public",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!selectedFile) {
        throw new Error("Please select a video file");
      }

      if (!currentUser?.isVerified) {
        throw new Error("Only verified users can upload videos");
      }

      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("category", data.category);
      formData.append("tags", data.tags || "");
      formData.append("visibility", data.visibility);
      formData.append("creatorId", currentUser.id);

      const response = await fetch(`${API_BASE_URL}/videos/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Upload successful!", 
        description: "Your video has been submitted for moderation" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      handleClose();
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setDragActive(false);
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
      } else {
        toast({ 
          title: "Invalid file type", 
          description: "Please select a video file",
          variant: "destructive" 
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
      } else {
        toast({ 
          title: "Invalid file type", 
          description: "Please select a video file",
          variant: "destructive" 
        });
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onSubmit = (data: UploadFormData) => {
    uploadMutation.mutate(data);
  };

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <i className="fas fa-globe text-4xl text-accent mb-4"></i>
            <p className="text-muted-foreground mb-4">
              You need to verify with World ID to upload videos
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Verification Status */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <i className="fas fa-globe text-accent"></i>
              <div>
                <p className="font-medium text-accent">World ID Verified</p>
                <p className="text-sm text-muted-foreground">
                  You can upload and interact with content
                </p>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive
                ? "border-primary/50 bg-primary/5"
                : selectedFile
                ? "border-green-500/50 bg-green-500/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("video-upload")?.click()}
            data-testid="upload-dropzone"
          >
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-video-file"
            />
            
            {selectedFile ? (
              <>
                <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
                <p className="text-lg font-medium mb-2">{selectedFile.name}</p>
                <p className="text-muted-foreground mb-4">
                  {formatFileSize(selectedFile.size)}
                </p>
                <Button variant="outline" onClick={() => setSelectedFile(null)}>
                  Remove File
                </Button>
              </>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
                <p className="text-lg font-medium mb-2">Drop your video file here</p>
                <p className="text-muted-foreground mb-4">or click to browse files</p>
                <Button type="button">Browse Files</Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Supported formats: MP4, MOV, AVI, WebM (Max 2GB)
                </p>
              </>
            )}
          </div>

          {/* Upload Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter video title..." 
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your video..."
                        rows={4}
                        className="resize-none"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="web3">Web3</SelectItem>
                          <SelectItem value="blockchain">Blockchain</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-visibility">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="unlisted">Unlisted</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="web3, blockchain, tutorial..."
                        {...field}
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload Process Info */}
              <div className="bg-muted/10 border border-muted/20 rounded-lg p-4">
                <h3 className="font-medium mb-2">Upload Process</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-shield-alt w-4"></i>
                    <span>1. Video sent to moderation queue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-user-check w-4"></i>
                    <span>2. Human moderator reviews content</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-server w-4"></i>
                    <span>3. Approved videos uploaded to IPFS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-globe w-4"></i>
                    <span>4. Video becomes publicly accessible</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || uploadMutation.isPending}
                  data-testid="button-submit"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner animate-spin mr-2"></i>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload mr-2"></i>
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
