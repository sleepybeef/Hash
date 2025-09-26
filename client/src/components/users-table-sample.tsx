
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function UsersTableSample() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setUsers(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users Table Data</h2>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
