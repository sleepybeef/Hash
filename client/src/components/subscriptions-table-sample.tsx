import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function SubscriptionsTableSample() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("subscriptions")
      .select("*")
      .then(({ data, error }) => {
        console.log("Supabase subscriptions response:", { data, error });
        if (error) setError(error.message);
        else setSubscriptions(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading subscriptions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Subscriptions Table Data</h2>
      <pre>{JSON.stringify(subscriptions, null, 2)}</pre>
    </div>
  );
}
