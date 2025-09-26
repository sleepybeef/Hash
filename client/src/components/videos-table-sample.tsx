import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function VideosTableSample() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("videos")
      .select("*")
      .then(({ data, error }) => {
        console.log("Supabase videos response:", { data, error });
        if (error) setError(error.message);
        else setVideos(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading videos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Videos Table Data</h2>
      <pre>{JSON.stringify(videos, null, 2)}</pre>
    </div>
  );
}
