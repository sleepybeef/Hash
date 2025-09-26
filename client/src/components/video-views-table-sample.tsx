import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function VideoViewsTableSample() {
  const [videoViews, setVideoViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("video_views")
      .select("*")
      .then(({ data, error }) => {
        console.log("Supabase video_views response:", { data, error });
        if (error) setError(error.message);
        else setVideoViews(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading video views...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Video Views Table Data</h2>
      <pre>{JSON.stringify(videoViews, null, 2)}</pre>
    </div>
  );
}
