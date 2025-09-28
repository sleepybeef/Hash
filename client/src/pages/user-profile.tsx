import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import UploadModal from "../components/upload-modal";


export default function UserProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUsernameMode, setEditUsernameMode] = useState(false);
  const [editBioMode, setEditBioMode] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  // Avatar upload functionality removed
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isOwnProfile = user && user.id === id;

  useEffect(() => {
    async function fetchProfile() {
      console.log("[UserProfile] Looking up user id:", id);
  const { data, error } = await supabase.from("users").select("id,username,avatar,bio").eq("id", id).single();
  console.log("[UserProfile] Supabase returned:", data, error);
  setProfile(data);
      setEditUsername(data?.username || "");
      setEditBio(data?.bio || "");
    const { data: vids } = await supabase.from("videos").select("*").eq("creator_id", id).eq("status", "approved");
      setVideos(vids || []);
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  // Avatar upload functionality removed

  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [bioErrorMsg, setBioErrorMsg] = useState("");

  async function handleUsernameSave() {
    setUsernameErrorMsg("");
    try {
  const resp = await fetch(`${API_BASE_URL}/user/${id}/username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername: editUsername })
      });
      const result = await resp.json();
      if (!resp.ok) {
        if (result.message?.includes("30 days")) {
          setUsernameErrorMsg("Please wait 30 days to change your username");
        } else if (result.message?.includes("taken")) {
          setUsernameErrorMsg("That username is taken :/");
        } else {
          setUsernameErrorMsg(result.message || "Failed to update username");
        }
        return;
      }
      setProfile((p: any) => ({ ...p, username: editUsername }));
      setEditUsernameMode(false);
    } catch (err) {
      setUsernameErrorMsg("Failed to update username");
    }
  }

  async function handleBioSave() {
    setBioErrorMsg("");
    try {
      await supabase.from("users").update({ bio: editBio }).eq("id", id);
      setProfile((p: any) => ({ ...p, bio: editBio }));
      setEditBioMode(false);
    } catch (err) {
      setBioErrorMsg("Failed to update bio");
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 pt-4 md:px-12 md:pt-8 pb-6 relative">
      {/* Navigation Bar (copied from home.tsx) */}
      <nav className="w-full flex justify-center mb-4">
        <ul className="flex gap-4 items-center bg-white bg-opacity-90 rounded-xl shadow p-2 min-h-[56px]">
          <li>
            <Link to="/" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Home</Link>
          </li>
          <li>
            <Link to="/subscriptions" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Subscriptions</Link>
          </li>
          <li>
            <Link to="/my-profile" className="px-4 py-2 rounded-lg font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition">My Profile</Link>
          </li>
          <li>
            <Link to="/settings" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Settings</Link>
          </li>
        </ul>
      </nav>
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading profile...</div>
        ) : !profile ? (
          <div className="text-center text-gray-500 py-8">User not found.</div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <img
                src={profile.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`}
                alt={profile.username + " avatar"}
                className="w-20 h-20 rounded-full border border-gray-200 object-cover mb-2"
              />
            </div>
            {editUsernameMode ? (
              <div className="w-full flex flex-col items-center gap-2">
                <div className="text-xs text-gray-500 mb-1">You can only change your username once every 30 days.</div>
                <Input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  placeholder="Username"
                  className="mb-2"
                />
                {usernameErrorMsg && (
                  <div className="text-sm text-red-500 mb-2">{usernameErrorMsg}</div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleUsernameSave} variant="default">Save</Button>
                  <Button onClick={() => { setEditUsernameMode(false); setUsernameErrorMsg(""); setEditUsername(profile.username); }} variant="outline">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-1">{profile.username}</h1>
                {/* Username change moved to settings page */}
              </>
            )}
            {editBioMode ? (
              <div className="w-full flex flex-col items-center gap-2">
                <Textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Bio"
                  className="mb-2"
                />
                {bioErrorMsg && (
                  <div className="text-sm text-red-500 mb-2">{bioErrorMsg}</div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleBioSave} variant="default">Save</Button>
                  <Button onClick={() => { setEditBioMode(false); setBioErrorMsg(""); setEditBio(profile.bio || ""); }} variant="outline">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-black mb-4">{profile.bio || "No bio yet."}</div>
                {/* Bio edit moved to settings page */}
              </>
            )}
            {isOwnProfile && (
              <Button onClick={() => setShowUploadModal(true)} variant="default" className="mb-4">Upload Video</Button>
            )}
            <h2 className="text-lg font-bold text-gray-700 mb-2">Videos by {profile.username}</h2>
            <ul className="w-full grid gap-4">
              {videos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No videos yet.</div>
              ) : (
                videos.map(video => (
                  <li key={video.id} className="p-4 rounded-xl shadow bg-white flex flex-col gap-2">
                    <strong className="text-lg font-semibold mb-1">{video.title}</strong>
                    <div className="text-gray-700 mb-1">{video.description}</div>
                    {video.ipfs_hash && (
                      <video
                        controls
                        src={`https://lavender-eldest-camel-675.mypinata.cloud/ipfs/${video.ipfs_hash}`}
                        className="mt-2 w-full max-w-md rounded shadow"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </li>
                ))
              )}
            </ul>
            {isOwnProfile && (
              <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} currentUser={user} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
