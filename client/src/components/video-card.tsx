import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: string;
  worldId: string;
  username: string;
  isVerified: boolean;
  isModerator: boolean;
  avatar: string | null;
  createdAt: string;
};

type Video = {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  category: string;
  tags: string[];
  visibility: string;
  status: string;
  ipfs_hash: string | null;
  thumbnail_hash: string | null;
  duration: number | null;
  file_size: number | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  moderator_id: string | null;
  moderated_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  creator: User;
};

interface VideoCardProps {
  video: Video;
  currentUser?: any;
}

export default function VideoCard({ video, currentUser }: VideoCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async ({ isLike }: { isLike: boolean }) => {
      if (!currentUser) {
        throw new Error("Must be logged in");
      }
      return apiRequest("POST", `/api/videos/${video.id}/like`, {
        userId: currentUser.id,
        isLike,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (error) => {
      toast({ 
        title: "Action failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const recordViewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/videos/${video.id}/view`, {});
    },
  });

  const handleVideoClick = () => {
    // Record view
    recordViewMutation.mutate();
    // TODO: Navigate to video player page
    console.log("Playing video:", video.id);
  };

  const handleLike = (e: React.MouseEvent, isLike: boolean) => {
    e.stopPropagation();
    
    if (!currentUser?.isVerified) {
      toast({ 
        title: "Verification required", 
        description: "Only verified users can like videos",
        variant: "destructive" 
      });
      return;
    }

    likeMutation.mutate({ isLike });
  };

  const getStatusBadge = () => {
    switch (video.status) {
      case "approved":
        return (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            <i className="fas fa-check-circle mr-1"></i>
            IPFS
          </div>
        );
      case "pending":
        return (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            <i className="fas fa-clock mr-1"></i>
            Pending
          </div>
        );
      case "rejected":
        return (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            <i className="fas fa-times mr-1"></i>
            Rejected
          </div>
        );
      default:
        return null;
    }
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={handleVideoClick}
      className="bg-card rounded-xl overflow-hidden hover:bg-card/80 transition-colors cursor-pointer group"
      data-testid={`video-card-${video.id}`}
    >
      <div className="relative">
        {/* Thumbnail placeholder */}
        <div className="w-full h-48 bg-muted flex items-center justify-center">
          <i className="fas fa-video text-4xl text-muted-foreground/50"></i>
        </div>
        
        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
        
        {/* Status Badge */}
        {getStatusBadge()}
      </div>
      
      <div className="p-4">
        <h3 
          className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2"
          data-testid={`video-title-${video.id}`}
        >
          {video.title}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
            {video.creator.avatar ? (
              <img 
                src={video.creator.avatar} 
                alt={video.creator.username} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-medium">
                {video.creator.username.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground" data-testid={`creator-${video.id}`}>
              {video.creator.username}
            </span>
            {video.creator.isVerified && (
              <i className="fas fa-check-circle text-accent text-xs"></i>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span data-testid={`views-${video.id}`}>
            {video.status === "pending" ? "Moderating..." : `${formatViewCount(video.view_count)} views`}
          </span>
          <span data-testid={`time-${video.id}`}>
            {formatTimeAgo(video.created_at)}
          </span>
        </div>
        
        {video.status === "approved" && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleLike(e, true)}
                disabled={likeMutation.isPending || !currentUser?.isVerified}
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors p-0 h-auto"
                data-testid={`like-button-${video.id}`}
              >
                <i className="fas fa-thumbs-up"></i>
                <span>{video.like_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleLike(e, false)}
                disabled={likeMutation.isPending || !currentUser?.isVerified}
                className="flex items-center space-x-1 text-muted-foreground hover:text-destructive transition-colors p-0 h-auto"
                data-testid={`dislike-button-${video.id}`}
              >
                <i className="fas fa-thumbs-down"></i>
                <span>{video.dislike_count}</span>
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary transition-colors p-0 h-auto"
              data-testid={`share-button-${video.id}`}
            >
              <i className="fas fa-share"></i>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
