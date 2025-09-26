import { useEffect, useState } from "react";
import { supabase } from "./supabase";

interface User {
  id: string;
  username: string;
  world_id: string;
  avatar?: string | null;
  is_verified: boolean;
  created_at: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("App component mounted");
    console.log("Vite env:", import.meta.env);

    async function fetchUsers() {
      try {
        const { data, error } = await supabase.from<User>("users").select("*");
        console.log("Supabase fetch result:", { data, error });

        if (error) throw error;
        setUsers(data ?? []);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) return <div className="p-4">Loading users...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="border p-2 rounded">
              <span className="font-semibold">{u.username}</span>{" "}
              {u.is_verified && <span className="text-green-500">✅ Verified</span>}
              <div className="text-sm text-gray-500">{u.world_id}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
