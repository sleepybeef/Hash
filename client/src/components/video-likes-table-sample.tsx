import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function VideoLikesTableSample() {
  const [videoLikes, setVideoLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("video_likes")
      .select("*")
      .then(({ data, error }) => {
        console.log("Supabase video_likes response:", { data, error });
        if (error) setError(error.message);
        else setVideoLikes(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading video likes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Video Likes Table Data</h2>
      <pre>{JSON.stringify(videoLikes, null, 2)}</pre>
    </div>
  );
}
