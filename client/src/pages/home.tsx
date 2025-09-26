import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

console.log("Home.tsx loaded");
console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

type Video = {
  id: string;
  title: string;
  description: string;
  // Add other fields as needed
};

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      const { data, error } = await supabase.from("videos").select("*");
      console.log("Supabase videos response (debug):", { data, error });
      setVideos((data as Video[]) || []);
      setError(error ? { message: error.message } : null);
      setLoading(false);
    }
    fetchVideos();
  }, []);

  if (loading) return <div>Loading videos...</div>;
  if (error) return <div>Error loading videos: {error.message}</div>;

  return (
    <div>
      <h1>Videos</h1>
      {videos.length === 0 ? (
        <div>No videos found.</div>
      ) : (
        <ul>
          {videos.map((video) => (
            <li key={video.id} style={{ marginBottom: "1rem" }}>
              <strong>{video.title}</strong>
              <div>{video.description}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
