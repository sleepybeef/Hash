import { useState } from "react";
import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";
import { useMutation } from "@tanstack/react-query";
import { useIsMobile } from "../hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

interface WorldIdVerifyProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (user: any) => void;
  appId: string;
}


export default function WorldIdVerify({ isOpen, onClose, onVerified, appId }: WorldIdVerifyProps) {
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"idle" | "checking" | "existing" | "new">("idle");
  const [worldIdProof, setWorldIdProof] = useState<any>(null);
  const [existingUser, setExistingUser] = useState<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const verifyMutation = useMutation({
    mutationFn: async ({ proofPayload, username }: { proofPayload: any, username: string }) => {
      // Send proof to backend for verification
      const response = await apiRequest("POST", "/api/auth/verify", {
        worldId: proofPayload.nullifier_hash,
        username,
        proof: proofPayload.proof,
        merkle_root: proofPayload.merkle_root,
        credential_type: proofPayload.credential_type,
        action: "video-plat-verif",
        signal: username,
      });
      return response.json();
    },
    onSuccess: (user) => {
      console.log("[WorldID] Backend response:", user);
      toast({ 
        title: "Verification successful!", 
        description: `Welcome, ${user.username}!` 
      });
      onVerified(user);
      setStep("idle");
      setUsername("");
      setWorldIdProof(null);
      setExistingUser(null);
    },
    onError: (error) => {
      toast({ 
        title: "Verification failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleVerify = async (proof: ISuccessResult) => {
    setStep("checking");
    setWorldIdProof(proof);
    // Check if user exists by worldId
    try {
      const worldId = proof.nullifier_hash;
      const response = await apiRequest("GET", `/api/user/by-worldid/${worldId}`);
      const user = await response.json();
      if (user && user.username) {
        // Instantly sign in the user and close the dialog
        onVerified(user);
        setStep("idle");
        setUsername("");
        setWorldIdProof(null);
        setExistingUser(null);
        // Optionally update verification status in backend
        verifyMutation.mutate({ proofPayload: proof, username: user.username });
      } else {
        setStep("new");
      }
    } catch (err) {
      setStep("new");
    }
  };

  const handleClose = () => {
    setUsername("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gray-50 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-globe text-accent"></i>
            <span>World ID Authentication</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-black">
          {/* Info Section */}
          <div className="bg-accent/10 border border-accent/20 rounded-3xl p-4">
            <div className="flex items-start space-x-3">
              <i className="fas fa-info-circle text-accent mt-0.5"></i>
              <div className="text-sm">
                {step === "idle" && <>
                  <p className="font-bold text-accent mb-1">Sign In or Create Account</p>
                  <p className="text-black">Verify with World ID to sign in or create a new account. One World ID equals one account.</p>
                </>}
                {step === "checking" && <p className="text-black">Checking account status...</p>}
                {step === "existing" && <>
                  <p className="font-bold text-accent mb-1">Sign In</p>
                  <p className="text-black">Welcome back, <span className="font-bold">{existingUser?.username}</span>! Click below to sign in.</p>
                </>}
                {step === "new" && <>
                  <p className="font-bold text-accent mb-1">Create Your Account</p>
                  <p className="text-black">Choose a unique username and link it to your World ID.</p>
                </>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Initial step: show World ID widget */}
            {step === "idle" && (
              !isMobile ? (
                <IDKitWidget
                  app_id={appId as `app_${string}`}
                  action={"video-plat-verif"}
                  signal={""}
                  onSuccess={handleVerify}
                  handleVerify={handleVerify}
                  verification_level={VerificationLevel.Orb}
                >
                  {({ open }: { open: () => void }) => (
                    <Button type="button" onClick={open} variant="default" className="w-full mt-2 text-black bg-white border border-black rounded-3xl font-bold">
                      Verify with World ID
                    </Button>
                  )}
                </IDKitWidget>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Button
                    type="button"
                    variant="default"
                    className="w-full mt-2 text-black bg-white border border-black rounded-3xl font-bold"
                    onClick={() => {
                      window.location.href = `https://id.worldcoin.org/verify?app_id=${appId}&action=video-plat-verif`;
                    }}
                  >
                    Verify in World App
                  </Button>
                  <span className="text-xs text-black text-center">You will be redirected to World App for verification.</span>
                </div>
              )
            )}

            {/* Existing user: sign in (no longer shown, handled automatically) */}

            {/* New user: choose username */}
            {step === "new" && (
              <>
                <Label htmlFor="username" className="text-black font-bold">Choose a Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your desired username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="input-username"
                  className="text-black bg-gray-100"
                />
                <div className="text-xs text-black mb-2">Your username will be linked to your World ID. You cannot change it later.</div>
                <Button
                  type="button"
                  variant="default"
                  className="w-full mt-2 text-black bg-white border border-black rounded-3xl font-bold"
                  onClick={() => verifyMutation.mutate({ proofPayload: worldIdProof, username: username.trim() })}
                  disabled={!username.trim()}
                >
                  Create Account & Link World ID
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel"
              className="text-black border-gray-400 rounded-3xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
