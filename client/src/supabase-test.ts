import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the Vite client env
dotenv.config({ path: path.resolve(__dirname, "../../client/.env") }); // <-- this path points to your client/.env

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL or anon key is missing. Make sure client/.env exists and contains VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY!"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      console.log("Users table data:", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testConnection();
