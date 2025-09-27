
import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuth } from "../lib/AuthContext";

export default function AdminPage() {
  const { user, setUser } = useAuth();
  const handleSignOut = () => {
    setUser(user ? { ...user, isModerator: false } : null);
    localStorage.removeItem("lastModPasswordVerified");
    window.location.href = "/";
  };
  useEffect(() => {
    document.body.classList.add('moderator-gradient-bg');
    // Check mod password expiry
    const lastModPasswordVerified = localStorage.getItem("lastModPasswordVerified");
    if (user?.isModerator && lastModPasswordVerified) {
      if (Date.now() - Number(lastModPasswordVerified) > 1800000) {
        setUser(user ? { ...user, isModerator: false } : null);
        localStorage.removeItem("lastModPasswordVerified");
      }
    }
    return () => {
      document.body.classList.remove('moderator-gradient-bg');
    };
  }, [user, setUser]);

  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSearch() {
    setError(""); setSuccess(""); setFoundUser(null); setLoading(true);
    setShowSetPassword(false); setShowVerifyPassword(false); setPassword("");
    const res = await fetch(`/api/user/by-username/${search}`);
    if (!res.ok) {
      setError("User not found");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setFoundUser(data);
    setLoading(false);
    if (data.isModerator) {
      if (!data.mod_password) {
        setShowSetPassword(true);
      } else {
        setShowVerifyPassword(true);
      }
    }
  }

  async function handleSetPassword() {
    setError(""); setSuccess("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const res = await fetch(`/api/user/${foundUser.id}/mod-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      setError("Failed to set password");
      return;
    }
    setSuccess("Password set!");
    setShowSetPassword(false);
    setShowVerifyPassword(true);
    setFoundUser({ ...foundUser, mod_password: "set" });
  }

  async function handleVerifyPassword() {
    setError(""); setSuccess("");
    const res = await fetch(`/api/user/${foundUser.id}/verify-mod-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      setError("Incorrect password");
      return;
    }
    setSuccess("Access granted!");
    setShowVerifyPassword(false);
    setUser({ ...foundUser, isModerator: true });
    localStorage.setItem("lastModPasswordVerified", String(Date.now()));
  }

  if (!user || !user.isModerator) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-8">
        <button onClick={handleSignOut} className="absolute top-4 left-4 px-4 py-2 rounded bg-red-600 text-white font-bold shadow">Sign Out</button>
        <h1 className="text-2xl font-bold mb-4">Moderator Login</h1>
        <div className="flex gap-2 mb-4">
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Enter your moderator username"
            className="w-64"
          />
          <Button onClick={handleSearch} disabled={loading || !search}>Search</Button>
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {foundUser && foundUser.isModerator && (
          <div className="bg-white rounded shadow p-4 mb-4 w-full max-w-md">
            <div><strong>Username:</strong> {foundUser.username}</div>
            {showSetPassword && (
              <div className="mt-4">
                <div className="mb-2">Set a moderator password:</div>
                <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="New password" className="mb-2" />
                <Button onClick={handleSetPassword}>Set Password</Button>
              </div>
            )}
            {showVerifyPassword && (
              <div className="mt-4">
                <div className="mb-2">Enter moderator password:</div>
                <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="Password" className="mb-2" />
                <Button onClick={handleVerifyPassword}>Verify Password</Button>
              </div>
            )}
            {success && <div className="text-green-600 mt-2">{success}</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8">
      <button onClick={handleSignOut} className="absolute top-4 left-4 px-4 py-2 rounded bg-red-600 text-white font-bold shadow">Sign Out</button>
      <h1 className="text-2xl font-bold mb-4">Moderator Homepage</h1>
      <div className="bg-white rounded shadow p-4 mb-4 w-full max-w-md">
        <div><strong>Welcome, {user.username}!</strong></div>
        <div className="mt-2">You are logged in as a moderator.</div>
        <div className="mt-4">
          <Button asChild className="mr-2">
            <a href="/moderator-dashboard">Go to Moderation Dashboard</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

