import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Video = {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  category: string;
  tags: string[];
  visibility: string;
  status: string;
  ipfsHash: string | null;
  thumbnailHash: string | null;
  duration: number | null;
  fileSize: number | null;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  moderatorId: string | null;
  moderatedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    worldId: string;
    username: string;
    isVerified: boolean;
    isModerator: boolean;
    avatar: string | null;
    createdAt: string;
  };
};

type ModerationStats = {
  pending: number;
  approved: number;
  rejected: number;
};

export default function ModeratorDashboard() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentUser] = useState<any>({ id: "mod-1", isModerator: true }); // Mock current user
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<ModerationStats>({
    queryKey: ["/api/moderation/stats", { userId: currentUser?.id }],
    enabled: !!currentUser?.isModerator,
  });

  const { data: pendingVideos = [] } = useQuery<Video[]>({
    queryKey: ["/api/moderation/queue", { userId: currentUser?.id }],
    enabled: !!currentUser?.isModerator,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ videoId, ipfsHash }: { videoId: string; ipfsHash?: string }) => {
      return apiRequest("POST", `/api/moderation/videos/${videoId}/approve`, {
        moderatorId: currentUser.id,
        ipfsHash,
        thumbnailHash: "thumbnail-hash-placeholder",
      });
    },
    onSuccess: () => {
      toast({ title: "Video approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/stats"] });
      setSelectedVideo(null);
    },
    onError: () => {
      toast({ title: "Failed to approve video", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ videoId, reason }: { videoId: string; reason: string }) => {
      return apiRequest("POST", `/api/moderation/videos/${videoId}/reject`, {
        moderatorId: currentUser.id,
        reason,
      });
    },
    onSuccess: () => {
      toast({ title: "Video rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/stats"] });
      setSelectedVideo(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Failed to reject video", variant: "destructive" });
    },
  });

  if (!currentUser?.isModerator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-shield-alt text-4xl text-muted-foreground mb-4"></i>
              <h1 className="text-xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You need moderator permissions to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={currentUser} />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Moderation Dashboard</h1>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-pending">
                        {stats?.pending || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-approved">
                        {stats?.approved || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Approved Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-rejected">
                        {stats?.rejected || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Rejected Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Queue */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Reviews ({pendingVideos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingVideos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <i className="fas fa-check-circle text-3xl mb-3"></i>
                        <p>No pending videos</p>
                      </div>
                    ) : (
                      pendingVideos.map((video) => (
                        <div
                          key={video.id}
                          onClick={() => setSelectedVideo(video)}
                          className={`border border-border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedVideo?.id === video.id 
                              ? 'bg-primary/10 border-primary/50' 
                              : 'hover:bg-muted/10'
                          }`}
                          data-testid={`video-queue-${video.id}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                              <i className="fas fa-video text-muted-foreground"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{video.title}</h4>
                              <p className="text-xs text-muted-foreground">by {video.creator.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(video.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Video Preview */}
            <div className="lg:col-span-2">
              {selectedVideo ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Video Preview Area */}
                      <div className="bg-black rounded-lg h-64 flex items-center justify-center">
                        <div className="text-center text-white">
                          <i className="fas fa-play-circle text-6xl mb-4 opacity-50"></i>
                          <p className="text-muted-foreground">Video Preview</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            File: {selectedVideo.title}
                          </p>
                        </div>
                      </div>

                      {/* Video Details */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg" data-testid="video-title">
                            {selectedVideo.title}
                          </h3>
                          <p className="text-muted-foreground" data-testid="video-description">
                            {selectedVideo.description || "No description provided"}
                          </p>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <span data-testid="video-creator">
                            Creator: {selectedVideo.creator.username}
                          </span>
                          <span data-testid="video-category">
                            Category: {selectedVideo.category}
                          </span>
                          <span data-testid="video-size">
                            Size: {selectedVideo.fileSize ? formatFileSize(selectedVideo.fileSize) : 'Unknown'}
                          </span>
                        </div>

                        {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedVideo.tags.map((tag, index) => (
                                <span 
                                  key={index}
                                  className="bg-muted/20 text-muted-foreground px-2 py-1 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rejection Reason Input */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Rejection Reason (optional)
                          </label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Provide reason for rejection..."
                            className="min-h-20"
                            data-testid="textarea-rejection-reason"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-4 pt-4">
                          <Button
                            onClick={() => approveMutation.mutate({ 
                              videoId: selectedVideo.id,
                              ipfsHash: `ipfs-${selectedVideo.id}` // Mock IPFS hash
                            })}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid="button-approve"
                          >
                            <i className="fas fa-check mr-2"></i>
                            {approveMutation.isPending ? "Approving..." : "Approve"}
                          </Button>
                          
                          <Button
                            onClick={() => rejectMutation.mutate({ 
                              videoId: selectedVideo.id,
                              reason: rejectionReason || "Content does not meet platform guidelines"
                            })}
                            disabled={rejectMutation.isPending}
                            variant="destructive"
                            data-testid="button-reject"
                          >
                            <i className="fas fa-times mr-2"></i>
                            {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                          </Button>
                          
                          <Button 
                            variant="outline"
                            data-testid="button-flag"
                          >
                            <i className="fas fa-flag mr-2"></i>
                            Flag for Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <i className="fas fa-mouse-pointer text-4xl mb-4"></i>
                      <p>Select a video from the queue to review</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
