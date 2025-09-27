import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Link } from "wouter";

type User = {
  id: string;
  username: string;
  isVerified: boolean;
  isModerator: boolean;
  avatar?: string | null;
};

interface NavigationProps {
  user?: User | null;
  onOpenUpload?: () => void;
  onOpenVerification?: () => void;
}

export default function Navigation({ user, onOpenUpload, onOpenVerification }: NavigationProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3" data-testid="logo">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <i className="fas fa-play text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              DecenTube
            </span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2"
                data-testid="input-search"
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                data-testid="button-search"
              >
                <i className="fas fa-search"></i>
              </Button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => user ? onOpenUpload?.() : onOpenVerification?.()}
              className="hidden md:flex items-center space-x-2"
              data-testid="button-upload"
            >
              <i className="fas fa-plus"></i>
              <span>Upload</span>
            </Button>

            {/* World ID Verification Status */}
            {user ? (
              <div className="flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-2">
                <div 
                  className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-orange-500'}`}
                  data-testid="verification-indicator"
                ></div>
                <span className="text-sm text-muted-foreground">
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
                <i className="fas fa-globe text-accent"></i>
              </div>
            ) : (
              <Button
                onClick={onOpenVerification}
                variant="outline"
                size="sm"
                data-testid="button-verify"
              >
                <i className="fas fa-globe mr-2"></i>
                Verify
              </Button>
            )}

            {/* Profile */}
            {user ? (
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center cursor-pointer"
                   data-testid="profile-avatar">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {getInitials(user.username)}
                  </span>
                )}
              </div>
            ) : (
              <Button
                onClick={onOpenVerification}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                data-testid="button-login"
              >
                <i className="fas fa-user"></i>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
