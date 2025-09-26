import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorldIdVerify from "../components/world-id-verify";
import { useAuth } from "../lib/AuthContext";
export default function MyProfilePage() {
  const { user, setUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.id) {
      navigate(`/user/${user.id}`);
    }
  }, [user, navigate]);
  const handleVerified = (userData: any) => {
    setDialogOpen(false);
    setUser({ ...userData, isVerified: true });
  };
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 pt-4 md:px-12 md:pt-8 pb-6 relative">
      {!user ? (
        <button
          className="absolute top-6 left-6 z-20 px-5 py-2 rounded-full bg-white text-indigo-600 font-semibold shadow hover:bg-indigo-50 border border-indigo-200 transition"
          onClick={() => setDialogOpen(true)}
        >
          Sign in With World ID
        </button>
      ) : null}
      <WorldIdVerify
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onVerified={handleVerified}
        appId="app_44c44d13873007e69e0abd75b9e7528d"
      />
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <header className="w-full flex flex-col items-center pb-2">
          <h1 className="text-4xl font-extrabold mb-2 text-center font-sans tracking-tight" style={{ fontFamily: 'Inter, DM Sans, Montserrat, sans-serif' }}>My Profile</h1>
        </header>
        {/* Tab Bar (copied from home) */}
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
              <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition" disabled>Settings</button>
            </li>
          </ul>
        </nav>
        <div className="w-full flex items-center justify-center mt-8 pb-2 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-700 text-center flex-1">{user ? user.username : "My Profile"}</h2>
        </div>
        <main className="w-full pt-6">
          {!user ? (
            <div className="text-center text-gray-700 py-16 text-lg">Sign in to upload!</div>
          ) : (
            <div className="text-center text-gray-500 py-16 text-lg">No uploads yet</div>
          )}
        </main>
      </div>
    </div>
  );
}
