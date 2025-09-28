import React, { useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

export default function ModerateVideoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [denyOpen, setDenyOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: video, isLoading, error } = useQuery({
    queryKey: ["/api/moderation/video", id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) throw new Error("Missing moderator userId");
        const res = await fetch(`${API_BASE_URL}/moderation/video/${id}?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      return res.json();
    },
    enabled: !!id && !!user?.id,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/moderation/videos/${id}/approve`, {
        moderatorId: user?.id || "",
      });
      if (!res.ok) throw new Error("Failed to approve video");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Video approved and sent to IPFS!",
        description: data?.ipfsHash ? `CID: ${data.ipfsHash}` : undefined,
      });
      queryClient.invalidateQueries();
      navigate("/moderator-dashboard");
    },
    onError: () => {
      toast({ title: "Failed to approve video", variant: "destructive" });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/moderation/videos/${id}/reject`, {
        moderatorId: user?.id || "",
        reason: rejectionReason,
      });
      if (!res.ok) throw new Error("Failed to reject video");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video denied" });
  queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      navigate("/moderator-dashboard");
    },
    onError: () => {
      toast({ title: "Failed to reject video", variant: "destructive" });
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error || !video) return <div className="p-8 text-red-600">Video not found.</div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Review Video</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-2">{video.title}</h2>
            <p className="text-muted-foreground mb-2">by {video.creator?.username}</p>
            <p className="text-muted-foreground mb-2">{video.description}</p>
            {/* Video preview area: show video player for both IPFS and local uploads */}
            <div className="bg-black rounded-lg h-64 flex items-center justify-center mb-4">
              {video.ipfsHash ? (
                <video controls className="w-full h-full max-h-64 rounded">
                  <source src={`https://ipfs.io/ipfs/${video.ipfsHash}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <video controls className="w-full h-full max-h-64 rounded">
                  <source src={`http://localhost:5000${video.playback_url}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.status === 'pending'}>
              Approve
            </Button>
            <Button variant="outline" onClick={() => setDenyOpen(true)}>
              Deny
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={denyOpen} onOpenChange={setDenyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Video</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Please provide a reason for denial:</div>
          <Textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Short explanation..."
            className="mb-4"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDenyOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                denyMutation.mutate();
                setDenyOpen(false);
              }}
              disabled={denyMutation.status === 'pending' || !rejectionReason}
            >
              Deny Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
