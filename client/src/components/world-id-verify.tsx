import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WorldIdVerifyProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (user: any) => void;
}

export default function WorldIdVerify({ isOpen, onClose, onVerified }: WorldIdVerifyProps) {
  const [username, setUsername] = useState("");
  const [worldId, setWorldId] = useState("");
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async ({ worldId, username }: { worldId: string; username: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify", {
        worldId,
        username,
      });
      return response.json();
    },
    onSuccess: (user) => {
      toast({ 
        title: "Verification successful!", 
        description: `Welcome, ${user.username}!` 
      });
      onVerified(user);
    },
    onError: (error) => {
      toast({ 
        title: "Verification failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!worldId.trim() || !username.trim()) {
      toast({ 
        title: "Missing information", 
        description: "Please provide both World ID and username",
        variant: "destructive" 
      });
      return;
    }

    verifyMutation.mutate({ worldId: worldId.trim(), username: username.trim() });
  };

  const handleClose = () => {
    setUsername("");
    setWorldId("");
    onClose();
  };

  // Mock World ID verification for demo purposes
  const handleMockVerification = () => {
    const mockWorldId = `world_${Date.now()}`;
    const mockUsername = username || "TestUser";
    verifyMutation.mutate({ worldId: mockWorldId, username: mockUsername });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-globe text-accent"></i>
            <span>World ID Verification</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Section */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <i className="fas fa-info-circle text-accent mt-0.5"></i>
              <div className="text-sm">
                <p className="font-medium text-accent mb-1">What is World ID?</p>
                <p className="text-muted-foreground">
                  World ID uses biometric verification to ensure you're a unique human, 
                  enabling our tiered access system for uploads and interactions.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your desired username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worldId">World ID</Label>
              <Input
                id="worldId"
                type="text"
                placeholder="Your World ID credential"
                value={worldId}
                onChange={(e) => setWorldId(e.target.value)}
                data-testid="input-world-id"
              />
              <p className="text-xs text-muted-foreground">
                This would normally integrate with the World ID SDK
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
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
                disabled={verifyMutation.isPending}
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Verify
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Demo Helper */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-2">
              For demo purposes:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMockVerification}
              disabled={verifyMutation.isPending}
              className="w-full"
              data-testid="button-mock-verify"
            >
              <i className="fas fa-magic mr-2"></i>
              Mock Verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
