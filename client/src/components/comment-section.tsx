import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { Button } from "../components/ui/button";

type Comment = {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
};

interface CommentSectionProps {
  videoId: string;
  likeCount: number;
  viewCount: number;
  onLike: () => void;
}

export default function CommentSection({ videoId, likeCount, viewCount, onLike }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
  const res = await fetch(`http://localhost:5000/api/comments/${videoId}`);
      const data = await res.json();
      setComments(data);
      setLoading(false);
    }
    fetchComments();
  }, [videoId]);

  async function handlePostComment() {
    if (!user || !newComment.trim()) return;
    setPosting(true);
  const res = await fetch("http://localhost:5000/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, userId: user.id, content: newComment })
    });
    if (res.ok) {
      setNewComment("");
  const comment: Comment = await res.json();
  // Ensure username is set for newly posted comment
  setComments([{ ...comment, username: user.username }, ...comments]);
    }
    setPosting(false);
  }

  async function handleDeleteComment(commentId: string) {
    if (!user) return;
  await fetch(`http://localhost:5000/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    });
    setComments(comments.filter(c => c.id !== commentId));
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <div className="flex items-center gap-6 mb-4">
        <Button onClick={onLike} variant="outline">👍 Like ({likeCount})</Button>
        <span className="text-gray-600">Views: {viewCount}</span>
      </div>
      <div className="mb-4">
        <textarea
          className="w-full border rounded p-2"
          rows={2}
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          disabled={posting}
        />
        <Button onClick={handlePostComment} disabled={posting || !newComment.trim()} className="mt-2">Post</Button>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-500">No comments yet.</div>
      ) : (
        <ul className="space-y-4">
          {comments.map(comment => (
            <li key={comment.id} className="border-b pb-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{comment.username ? comment.username : comment.user_id}</span>
                {user && user.id === comment.user_id && (
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteComment(comment.id)}>Delete</Button>
                )}
              </div>
              <div className="mt-1 text-gray-800">{comment.content}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(comment.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
