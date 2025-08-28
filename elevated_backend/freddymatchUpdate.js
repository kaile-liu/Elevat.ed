import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// 🔐 Supabase setup (Service Role Key is server-side only)
const supabaseUrl = 'https://txgfvqffljglhgfwrwxn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function syncIsOnline() {
  try {
    // 1️⃣ Fetch all opportunities from Supabase
    const { data: dbOpportunities, error: fetchError } = await supabase
      .from("Freddymatch_opportunities")
      .select("id, is_online");

    if (fetchError) throw fetchError;
    console.log(`Fetched ${dbOpportunities.length} opportunities from Supabase`);

    // 2️⃣ Fetch opportunities from API
    const response = await fetch("https://freddymatch.org/api/opportunities/");
    if (!response.ok) throw new Error(`API fetch failed: ${response.status}`);
    const apiOpportunities = await response.json();
    console.log(`Fetched ${apiOpportunities.length} opportunities from API`);

    // 3️⃣ Create a lookup map from API by id
    const apiMap = new Map(apiOpportunities.map((opp) => [opp.id, opp.is_online]));

    // 4️⃣ Find records that need updates
    const updates = dbOpportunities
      .filter((dbOpp) => apiMap.has(dbOpp.id) && dbOpp.is_online !== apiMap.get(dbOpp.id))
      .map((dbOpp) => ({
        id: dbOpp.id,
        is_online: apiMap.get(dbOpp.id),
      }));

    console.log(`Found ${updates.length} records needing update`);

    // 5️⃣ Batch update in chunks (to avoid payload issues)
    const chunkSize = 100;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const { error: updateError } = await supabase
        .from("Freddymatch_opportunities")
        .upsert(chunk, { onConflict: 'id' });

      if (updateError) throw updateError;
      console.log(`Updated ${chunk.length} records`);
    }

    console.log("✅ Sync completed!");
  } catch (err) {
    console.error("❌ Error syncing is_online:", err);
  }
}

syncIsOnline();
