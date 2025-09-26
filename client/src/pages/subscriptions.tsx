import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WorldIdVerify from "../components/world-id-verify";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

type Subscription = {
  id: string;
  subscriber_id: string;
  creator_id: string;
  created_at: string;
};

export default function Subscriptions() {
  const { user, setUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleVerified = (userData: any) => {
    setDialogOpen(false);
    setUser({ ...userData, isVerified: true });
  };

  useEffect(() => {
    async function fetchSubscriptions() {
      if (!user) return;
      const { data, error } = await supabase.from("subscriptions").select("*");
      setSubscriptions((data as Subscription[]) || []);
      setError(error ? { message: error.message } : null);
      setLoading(false);
    }
    fetchSubscriptions();
  }, [user]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 pt-4 md:px-12 md:pt-8 pb-6 relative">
      {!user ? (
        <button
          className="absolute top-6 left-6 z-20 px-5 py-2 rounded-full bg-white text-indigo-600 font-semibold shadow hover:bg-indigo-50 border border-indigo-200 transition"
          onClick={() => setDialogOpen(true)}
        >
          Sign in With World ID
        </button>
      ) : (
        <div className="absolute top-6 left-6 z-20 px-5 py-2 rounded-full bg-white text-indigo-600 font-semibold shadow border border-indigo-200 transition flex items-center gap-2">
          <i className="fas fa-user-circle text-indigo-600"></i>
          {user.username}
        </div>
      )}
      <WorldIdVerify
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onVerified={handleVerified}
        appId="app_44c44d13873007e69e0abd75b9e7528d"
      />
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <header className="w-full flex flex-col items-center pb-2">
          <h1 className="text-4xl font-extrabold mb-2 text-center font-sans tracking-tight" style={{ fontFamily: 'Inter, DM Sans, Montserrat, sans-serif' }}>
            {user ? `${user.username}'s Subscriptions` : "Subscriptions"}
          </h1>
        </header>
        {/* Tab Bar (copied from home) */}
        <nav className="w-full flex justify-center mb-4">
          <ul className="flex gap-4 items-center bg-white bg-opacity-90 rounded-xl shadow p-2 min-h-[56px]">
            <li>
              <Link to="/" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">Home</Link>
            </li>
            <li>
              <Link to="/subscriptions" className="px-4 py-2 rounded-lg font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition">Subscriptions</Link>
            </li>
            <li>
              <Link to="/my-profile" className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">My Profile</Link>
            </li>
            <li>
              <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition" disabled>Settings</button>
            </li>
          </ul>
        </nav>
        <div className="w-full flex items-center justify-center mt-8 pb-2 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-700 text-center flex-1">Subscriptions</h2>
        </div>
        <main className="w-full pt-6">
          {!user ? (
            <div className="text-center text-gray-700 py-16 text-lg">Sign in to Subscribe!</div>
          ) : loading ? (
            <div className="text-center text-gray-500 py-16">Loading subscriptions...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-16">Error loading subscriptions: {error.message}</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center text-gray-500 py-16">No subscriptions yet</div>
          ) : (
            <ul className="grid gap-8">
              {subscriptions.map((sub) => (
                <li key={sub.id} className="p-6 rounded-xl shadow bg-gray-50 flex flex-row gap-4 items-center">
                  <div className="flex-1 flex flex-col gap-2">
                    <strong className="text-lg font-semibold mb-2">Creator ID: {sub.creator_id}</strong>
                    <div className="text-gray-700 mb-2">Subscribed on: {new Date(sub.created_at).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
        <footer className="w-full py-4 mt-8 border-t border-gray-200 bg-white/60">
          <div className="container mx-auto px-4 text-xs text-gray-500 flex flex-wrap gap-4 justify-center">
            <a href="#community-guidelines" className="hover:underline">Community Guidelines</a>
            <span>|</span>
            <a href="#what-is-hash" className="hover:underline">What is Hash</a>
            <span>|</span>
            <a href="#data-security" className="hover:underline">Data and Security</a>
            <span>|</span>
            <a href="#unpin-requests" className="hover:underline">Unpin Requests</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
