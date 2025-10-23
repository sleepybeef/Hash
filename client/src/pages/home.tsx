import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/AuthContext";
import WorldIdVerify from "../components/world-id-verify";
import { lazy, Suspense } from "react";
const UploadModal = lazy(() => import("../components/upload-modal"));
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
const CommentSection = lazy(() => import("../components/comment-section"));
import { Loading, ErrorFeedback } from "../components/ui/feedback";
import { useFeatures } from "../lib/features";

console.log("Home.tsx loaded");
console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
type Video = {
  id: string;
  title: string;
  description: string;
  thumbnail_hash?: string;
  ipfs_hash?: string;
  like_count?: number;
  view_count?: number;
  // Add other fields as needed
};

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const { user, setUser } = useAuth();
  const { data: features } = useFeatures();

  const handleVerified = (userData: any) => {
    setDialogOpen(false);
    setUser({ ...userData, isVerified: true });
  };

  const {
    data: videos = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Video[]>({
    queryKey: ["videos", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("status", "approved");
      if (error) throw new Error(error.message);
      return (data as Video[]) || [];
    },
  });

  if (loading) {
    return <Loading message="Loading videos..." />;
  }
  if (error) {
    return <ErrorFeedback error={error} />;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Search by title, description, or CID
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("status", "approved")
      .or(`title.ilike.%${search}%,description.ilike.%${search}%,id.eq.${search},ipfs_hash.eq.${search}`);
    setSearchResults((data as Video[]) || []);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 pt-4 md:px-12 md:pt-8 pb-6 relative">
      {/* Feature indicator: GPT-5 */}
      {features?.enableGpt5 && (
        <div className="absolute top-6 right-6 z-20 px-3 py-1 rounded-full bg-black/70 text-white text-xs tracking-wide border border-white/20">
          AI: {features.aiModel}
        </div>
      )}
      {/* Top left: sign-in or user info */}
      {!user ? (
        <button
          className="absolute top-6 left-6 z-20 px-5 py-2 rounded-full bg-white text-indigo-600 font-semibold shadow hover:bg-indigo-50 border border-indigo-200 transition"
          onClick={() => setDialogOpen(true)}
        >
          Sign in With World ID
        </button>
      ) : (
        <div className="absolute top-6 left-6 z-20 flex flex-col items-start">
          <div className="px-5 py-2 rounded-full bg-white text-indigo-600 font-semibold shadow border border-indigo-200 transition flex items-center gap-2 mb-2">
            <i className="fas fa-user-circle text-indigo-600"></i>
            {user.username || "User"}
          </div>
          <button
            className="mt-2 px-5 py-2 rounded-full bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 border border-indigo-200 transition"
            onClick={() => setUploadOpen(true)}
          >
            <i className="fas fa-upload mr-2"></i>
            Upload Video
          </button>
        </div>
      )}
      <WorldIdVerify
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onVerified={handleVerified}
        appId="app_44c44d13873007e69e0abd75b9e7528d"
      />
      <Suspense fallback={<div className="p-8 text-center">Loading upload modal...</div>}>
        <UploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          currentUser={user}
        />
      </Suspense>
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <header className="w-full flex flex-col items-center pb-2">
          <h1 className="text-4xl font-extrabold mb-2 text-center font-sans tracking-tight" style={{ fontFamily: 'Inter, DM Sans, Montserrat, sans-serif' }}>Welcome to Hash</h1>
          <div className="text-base text-gray-700 text-center mb-6 max-w-xl">
            Hash is a Web-3 video platform with human connection in mind. Sign in with World ID to upload videos, comment, like, or subscribe to users!
          </div>
        </header>
        {/* Tab Bar */}
        <nav className="w-full flex justify-center mb-4">
          <ul className="flex gap-4 items-center bg-white bg-opacity-90 rounded-xl shadow p-2 min-h-[56px]">
            <li className="flex items-center justify-center">
              <Link to="/" className="px-4 py-2 rounded-lg font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition flex items-center justify-center">Home</Link>
            </li>
            <li className="flex items-center justify-center">
              <Link to="/subscriptions" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition flex items-center justify-center">Subscriptions</Link>
            </li>
            <li className="flex items-center justify-center">
              <Link to="/my-profile" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition flex flex-col items-center justify-center">
                <span className="block leading-tight">My</span>
                <span className="block leading-tight">Profile</span>
              </Link>
            </li>
            <li className="flex items-center justify-center">
              <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition flex items-center justify-center" disabled>Settings</button>
            </li>
            {user?.isModerator && (
              <li className="flex items-center justify-center">
                <Link to="/admin" className="px-4 py-2 rounded-lg font-medium text-pink-600 bg-pink-100 hover:bg-pink-200 transition flex items-center justify-center h-full">
                  <span className="w-full text-center">Moderator Homepage</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="w-full flex flex-col items-center justify-center mt-8 pb-2 border-b border-gray-200 gap-4">
          <h2 className="text-lg font-bold text-gray-700 text-center flex-1">Videos</h2>
          {/* Search Bar */}
          <form className="w-full max-w-md flex gap-2" onSubmit={handleSearch}>
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by title, description, username, or CID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Search
            </button>
          </form>
        </div>
        <main className="w-full pt-6">
          {loading ? (
            <div className="text-center text-gray-500 py-16">Loading videos...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-16">Error loading videos: {(error as any).message}</div>
          ) : (search ? searchResults.length === 0 : videos.length === 0) ? (
            <div className="text-center text-gray-500 py-16">No videos found.</div>
          ) : (
            <ul className="grid gap-8">
                {(search ? searchResults : videos).map((video) => (
                  <li key={video.id} className="p-6 rounded-xl shadow bg-gray-50 flex flex-col gap-4">
                    <div className="flex flex-row gap-4 items-center">
                      <div className="flex-1 flex flex-col gap-2">
                        <strong className="text-lg font-semibold mb-2">{video.title}</strong>
                        <div className="text-gray-700 mb-2">{video.description}</div>
                        {video.ipfs_hash && (
                          <a
                            href={`https://lavender-eldest-camel-675.mypinata.cloud/ipfs/${video.ipfs_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-xs"
                          >
                            View on IPFS
                          </a>
                        )}
                        {video.ipfs_hash && (
                          <video
                            controls
                            src={`https://lavender-eldest-camel-675.mypinata.cloud/ipfs/${video.ipfs_hash}`}
                            className="mt-2 w-full max-w-md rounded shadow"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                      {video.thumbnail_hash ? (
                        <img
                          src={`https://ipfs.io/ipfs/${video.thumbnail_hash}`}
                          alt={video.title + ' thumbnail'}
                          className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-xl text-gray-400 text-xs">No Thumbnail</div>
                      )}
                    </div>
                    <Suspense fallback={<div className="text-gray-500">Loading comments...</div>}>
                      <CommentSection
                        videoId={video.id}
                        likeCount={video.like_count || 0}
                        viewCount={video.view_count || 0}
                        onLike={() => {}}
                      />
                    </Suspense>
                  </li>
                ))}
            </ul>
          )}
        </main>
         <footer className="w-full py-4 mt-8 border-t border-gray-200 bg-white/60">
           <div className="container mx-auto px-4 text-xs text-gray-500 flex items-center justify-center">
             <div className="flex items-center justify-center w-full whitespace-nowrap">
               <a href="#community-guidelines" className="hover:underline">Community Guidelines</a>
               <span className="mx-3">|</span>
               <a href="#what-is-hash" className="hover:underline">What is Hash</a>
               <span className="mx-3">|</span>
               <a href="#data-security" className="hover:underline">Data and Security</a>
               <span className="mx-3">|</span>
               <a href="#unpin-requests" className="hover:underline">Unpin Requests</a>
               <span className="mx-3">|</span>
               <a
                 href="/admin"
                 className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                 style={{ textDecoration: "none" }}
               >
                 Internal
               </a>
             </div>
           </div>
         </footer>
      </div>
    </div>
  );
}
