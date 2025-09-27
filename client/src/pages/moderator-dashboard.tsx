import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

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
  // Force refetch of moderation queue on mount
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
  }, []);
  const { user: currentUser, setUser } = useAuth();
  // Store moderator user in localStorage on sign-in
  React.useEffect(() => {
    if (currentUser && currentUser.isModerator) {
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  }, [currentUser]);
  const handleSignOut = () => {
    setUser(currentUser ? { ...currentUser, isModerator: false } : null);
    localStorage.removeItem("lastModPasswordVerified");
    window.location.href = "/";
  };
  useEffect(() => {
    document.body.classList.add('moderator-gradient-bg');
    // Check mod password expiry
    const lastModPasswordVerified = localStorage.getItem("lastModPasswordVerified");
    if (currentUser?.isModerator && lastModPasswordVerified) {
      if (Date.now() - Number(lastModPasswordVerified) > 1800000) {
        setUser(currentUser ? { ...currentUser, isModerator: false } : null);
        localStorage.removeItem("lastModPasswordVerified");
        window.location.href = "/admin";
      }
    }
    return () => {
      document.body.classList.remove('moderator-gradient-bg');
    };
  }, [currentUser, setUser]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  // removed duplicate declaration
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<ModerationStats>({
    queryKey: ["/api/moderation/stats", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.isModerator || !currentUser?.id) return { pending: 0, approved: 0, rejected: 0 };
      const res = await fetch(`/api/moderation/stats?userId=${currentUser.id}`);
      if (!res.ok) throw new Error("Failed to fetch moderation stats");
      return res.json();
    },
    enabled: !!currentUser?.isModerator,
  });

  const { data: pendingVideos = [] } = useQuery<Video[]>({
    queryKey: ["/api/moderation/queue", { userId: currentUser?.id }],
    queryFn: async () => {
      if (!currentUser?.isModerator || !currentUser?.id) return [];
      const res = await fetch(`/api/moderation/queue?userId=${currentUser.id}`);
      if (!res.ok) throw new Error("Failed to fetch pending videos");
      return res.json();
    },
    enabled: !!currentUser?.isModerator,
  });

  const [approvedCID, setApprovedCID] = useState<string | null>(null);
  const approveMutation = useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!currentUser || !currentUser.isModerator) throw new Error("Not authorized");
      const res = await fetch(`/api/moderation/videos/${videoId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderatorId: currentUser.id }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to approve video");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Video approved and uploaded to IPFS!" });
      setApprovedCID(data.ipfsHash);
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/pending"] });
      setSelectedVideo(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve video", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ videoId, reason }: { videoId: string; reason: string }) => {
      if (!currentUser || !currentUser.isModerator) throw new Error("Not authorized");
      return apiRequest("POST", "/api/moderation/review", {
        videoId,
        status: "rejected",
        moderatorId: currentUser.id,
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({ title: "Video rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/pending"] });
      setSelectedVideo(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Failed to reject video", variant: "destructive" });
    },
  });

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

  if (!currentUser?.isModerator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-gray-200 p-8">
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

  return (
  <div className="min-h-screen w-full flex flex-col items-center justify-center p-8">
    <button onClick={handleSignOut} className="absolute top-4 left-4 px-4 py-2 rounded bg-red-600 text-white font-bold shadow">Sign Out</button>
  <div className="bg-white rounded shadow p-4 mb-4 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4">Moderation Dashboard</h1>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Moderation Queue: All pending videos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Queue ({pendingVideos.length})</CardTitle>
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
                        className={`border border-border rounded-lg p-3 transition-colors hover:bg-muted/10`}
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
                          <div className="flex items-center">
                            <Button
                              className="ml-4 px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                              onClick={() => window.location.href = `/moderate/${video.id}`}
                            >
                              Review Video
                            </Button>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
