import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { supabase } from "../lib/supabase";

import { Link } from "react-router-dom";

export default function SettingsPage() {
  const { user } = useAuth();
  const [editUsername, setEditUsername] = useState(user?.username || "");
  // If user.bio is not present, fallback to empty string
  const [editBio, setEditBio] = useState((user && "bio" in user ? (user as any).bio : "") || "");
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [bioErrorMsg, setBioErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleUsernameSave() {
    setUsernameErrorMsg("");
    setSuccessMsg("");
    if (!user) return;
    try {
      const resp = await fetch(`/api/user/${user.id}/username`, {
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
      setSuccessMsg("Username updated!");
    } catch (err) {
      setUsernameErrorMsg("Failed to update username");
    }
  }

  async function handleBioSave() {
    setBioErrorMsg("");
    setSuccessMsg("");
    if (!user) return;
    try {
      await supabase.from("users").update({ bio: editBio }).eq("id", user.id);
      setSuccessMsg("Bio updated!");
    } catch (err) {
      setBioErrorMsg("Failed to update bio");
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 pt-4 md:px-12 md:pt-8 pb-6 relative">
      {/* Navigation Bar (copied from user-profile.tsx) */}
      <nav className="w-full flex justify-center mb-4">
        <ul className="flex gap-4 items-center bg-white bg-opacity-90 rounded-xl shadow p-2 min-h-[56px]">
          <li>
            <Link to="/" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Home</Link>
          </li>
          <li>
            <Link to="/subscriptions" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Subscriptions</Link>
          </li>
          <li>
            <Link to="/my-profile" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">My Profile</Link>
          </li>
          <li>
            <Link to="/settings" className="px-4 py-2 rounded-lg font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition">Settings</Link>
          </li>
        </ul>
      </nav>
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <div className="w-full flex flex-col items-center gap-4">
          <div className="w-full flex flex-col items-center gap-2">
            <label className="font-semibold mb-1">Change Username</label>
            <Input
              value={editUsername}
              onChange={e => setEditUsername(e.target.value)}
              placeholder="Username"
              className="mb-2"
            />
            {usernameErrorMsg && (
              <div className="text-sm text-red-500 mb-2">{usernameErrorMsg}</div>
            )}
            <Button onClick={handleUsernameSave} variant="default">Save Username</Button>
          </div>
          <div className="w-full flex flex-col items-center gap-2">
            <label className="font-semibold mb-1">Change Bio</label>
            <Textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Bio"
              className="mb-2"
            />
            {bioErrorMsg && (
              <div className="text-sm text-red-500 mb-2">{bioErrorMsg}</div>
            )}
            <Button onClick={handleBioSave} variant="default">Save Bio</Button>
          </div>
          {successMsg && (
            <div className="text-sm text-green-600 mt-2">{successMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
}
