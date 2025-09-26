import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function UserSearchPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id,username,avatar,bio")
      .ilike("username", `%${search}%`);
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 pt-4 md:px-12 md:pt-8 pb-6 relative">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold mb-4">Search Users</h1>
        <form className="w-full flex gap-2" onSubmit={handleSearch}>
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search by username..."
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
        {loading ? (
          <div className="text-center text-gray-500 py-8">Searching...</div>
        ) : results.length === 0 && search ? (
          <div className="text-center text-gray-500 py-8">No users found.</div>
        ) : (
          <ul className="w-full grid gap-4">
            {results.map(u => (
              <li key={u.id} className="p-4 rounded-xl shadow bg-white flex items-center gap-4">
                <img
                  src={u.avatar || "https://api.dicebear.com/7.x/identicon/svg?seed=" + u.username}
                  alt={u.username + " avatar"}
                  className="w-12 h-12 rounded-full border border-gray-200 object-cover"
                />
                <div className="flex-1">
                  <Link to={`/user/${u.id}`} className="font-bold text-indigo-600 hover:underline text-lg">{u.username}</Link>
                  <div className="text-xs text-gray-500 mt-1">{u.bio || "No bio yet."}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
