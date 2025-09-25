import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import VideoCard from "@/components/video-card";
import UploadModal from "@/components/upload-modal";
import WorldIdVerify from "@/components/world-id-verify";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

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

export default function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWorldIdModal, setShowWorldIdModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const handleWorldIdVerified = (user: any) => {
    setCurrentUser(user);
    setShowWorldIdModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        user={currentUser} 
        onOpenUpload={() => setShowUploadModal(true)}
        onOpenVerification={() => setShowWorldIdModal(true)}
      />

      <div className="flex pt-16 pb-20 md:pb-0">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden md:block w-64 fixed left-0 top-16 bottom-0 bg-card border-r border-border overflow-y-auto hide-scrollbar">
          <div className="p-4 space-y-6">
            {/* Main Navigation */}
            <nav className="space-y-2">
              <Link 
                href="/" 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20"
                data-testid="nav-home"
              >
                <i className="fas fa-home w-5"></i>
                <span>Home</span>
              </Link>
              <a 
                href="#" 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10"
                data-testid="nav-trending"
              >
                <i className="fas fa-fire w-5"></i>
                <span>Trending</span>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10"
                data-testid="nav-explore"
              >
                <i className="fas fa-compass w-5"></i>
                <span>Explore</span>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10"
                data-testid="nav-watch-later"
              >
                <i className="fas fa-clock w-5"></i>
                <span>Watch Later</span>
              </a>
            </nav>

            {/* Moderator Section */}
            {currentUser?.isModerator && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Moderation</h3>
                <nav className="space-y-2">
                  <Link 
                    href="/moderation" 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10"
                    data-testid="nav-moderation"
                  >
                    <i className="fas fa-shield-alt w-5"></i>
                    <span>Review Queue</span>
                  </Link>
                </nav>
              </div>
            )}

            {/* Subscriptions */}
            {currentUser && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Subscriptions</h3>
                <div className="text-sm text-muted-foreground text-center py-4">
                  No subscriptions yet
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Section */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Decentralized Video Platform
                </h1>
                <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
                  Share, discover, and monetize your content on a censorship-resistant platform powered by IPFS and World ID verification.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => setShowWorldIdModal(true)}
                    className="bg-white text-primary hover:bg-white/90 px-6 py-3"
                    data-testid="button-verify-world-id"
                  >
                    <i className="fas fa-globe mr-2"></i>
                    Verify with World ID
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10 px-6 py-3"
                    data-testid="button-watch-guest"
                  >
                    <i className="fas fa-play mr-2"></i>
                    Watch as Guest
                  </Button>
                </div>
              </div>
            </section>

            {/* Video Feed */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Latest Videos</h2>
                <div className="flex items-center space-x-4">
                  <Select defaultValue="recent">
                    <SelectTrigger className="w-32" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="most-viewed">Most Viewed</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                      <div className="w-full h-48 bg-muted"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <i className="fas fa-video text-4xl mb-4 opacity-50"></i>
                  <p>No videos found. Be the first to upload!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}

              {/* Load More */}
              {videos.length > 0 && (
                <div className="text-center mt-8">
                  <Button 
                    variant="secondary" 
                    className="px-6 py-3"
                    data-testid="button-load-more"
                  >
                    <i className="fas fa-refresh mr-2"></i>
                    Load More Videos
                  </Button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
        <div className="flex items-center justify-around py-3">
          <button className="flex flex-col items-center space-y-1 text-primary" data-testid="mobile-nav-home">
            <i className="fas fa-home text-lg"></i>
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground" data-testid="mobile-nav-explore">
            <i className="fas fa-compass text-lg"></i>
            <span className="text-xs">Explore</span>
          </button>
          <button 
            onClick={() => currentUser ? setShowUploadModal(true) : setShowWorldIdModal(true)}
            className="flex flex-col items-center space-y-1 text-muted-foreground"
            data-testid="mobile-nav-upload"
          >
            <i className="fas fa-plus text-lg"></i>
            <span className="text-xs">Upload</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground" data-testid="mobile-nav-profile">
            <i className="fas fa-user text-lg"></i>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>

      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        currentUser={currentUser}
      />

      <WorldIdVerify 
        isOpen={showWorldIdModal} 
        onClose={() => setShowWorldIdModal(false)}
        onVerified={handleWorldIdVerified}
      />
    </div>
  );
}
