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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-500">Loading videos...</div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-red-500">Error loading videos: {error.message}</div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 py-6 md:px-12 md:py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Tab Bar */}
        <nav className="w-full flex justify-center mb-4">
          <ul className="flex gap-4 bg-white bg-opacity-90 rounded-xl shadow p-2">
            <li>
              <button className="px-4 py-2 rounded-lg font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition">Home</button>
            </li>
            <li>
              <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Subscriptions</button>
            </li>
            <li>
              <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">My Videos</button>
            </li>
            <li>
              <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Settings</button>
            </li>
          </ul>
        </nav>
        <header className="w-full flex flex-col items-center pb-2 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold mb-2 text-center">Welcome to Hash</h1>
          <div className="text-base text-gray-700 text-center mb-6 max-w-xl">
            Hash is a Web-3 video platform with human connection in mind. Sign in with World ID to upload videos, comment, like, or subscribe to users!
          </div>
          <div className="w-full flex items-center justify-center mt-8">
            <h2 className="text-lg font-bold text-gray-700 text-center flex-1">Videos</h2>
          </div>
        </header>
        <main className="w-full pt-6">
          {videos.length === 0 ? (
            <div className="text-center text-gray-500 py-16">No videos found.</div>
          ) : (
            <ul className="grid gap-8">
              {videos.map((video) => (
                <li key={video.id} className="p-6 rounded-xl shadow bg-gray-50 flex flex-col gap-2">
                  <strong className="text-lg font-semibold mb-2">{video.title}</strong>
                  <div className="text-gray-700 mb-2">{video.description}</div>
                  {/* Add more video info here as needed */}
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
