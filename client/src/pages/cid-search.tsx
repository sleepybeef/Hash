import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function CIDSearchPage() {
  const [cid, setCid] = useState("");
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setVideo(null);
    // Search for video by CID
    const { data, error: supaError } = await supabase
      .from("videos")
      .select("*")
      .eq("ipfs_hash", cid)
      .eq("status", "approved");
    if (supaError) {
      setError("Error searching videos: " + supaError.message);
    } else if (data && data.length > 0) {
      setVideo(data[0]);
    } else {
      setError("No videos found for this CID.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 pt-4 md:px-12 md:pt-8 pb-6 relative">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold mb-4">Search by IPFS CID</h1>
        <form className="w-full flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter IPFS CID..."
            value={cid}
            onChange={e => { setCid(e.target.value); setError(""); setVideo(null); }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Search
          </button>
        </form>
        {loading && <div className="text-center text-gray-500 py-8">Searching...</div>}
        {error && !loading && <div className="text-center text-red-500 py-8">{error}</div>}
        {video && (
          <div className="w-full flex flex-col items-center mt-6">
            <h2 className="font-bold text-lg mb-2">{video.title}</h2>
            <video
              controls
              src={`https://lavender-eldest-camel-675.mypinata.cloud/ipfs/${video.ipfs_hash}`}
              className="w-full max-w-md rounded shadow"
            >
              Your browser does not support the video tag.
            </video>
            <div className="mt-2 text-xs text-gray-600">CID: {video.ipfs_hash}</div>
          </div>
        )}
      </div>
    </div>
  );
}
