
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupabaseTestPage() {
  const [message, setMessage] = useState("Connecting to Supabase...");

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("games")
        .select("id")
        .limit(1);

      if (error) {
        setMessage(`Supabase error: ${error.message}`);
      } else {
        setMessage(
          `Success! BrandBridge connected to Supabase. ${data.length} visible game(s) returned.`
        );
      }
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>BrandBridge — Supabase Connection Test</h1>
      <p>{message}</p>
    </main>
  );
}
