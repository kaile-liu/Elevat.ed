import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Below is the Supabase project URL and Service Role Key.
// Note: The Service Role Key should NEVER be exposed on the client side.
const supabaseUrl = 'https://txgfvqffljglhgfwrwxn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

try {
    // 1️⃣ Fetch opportunities from API
    const response = await fetch("https://freddymatch.org/api/opportunities/");
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
    }
    const opportunities = await response.json();
    console.log(`Fetched ${opportunities.length} opportunities`);

    const formattedRecords = opportunities.map((opp) => ({
        id: opp.id || null,
        url: opp.url || "",
        organisation: opp.organisation || {},
        locations: opp.locations || [],
        title: opp.title || "",
        intro: opp.intro || "",
        extra: opp.extra || "",
        about: opp.about || [],
        commitment: opp.commitment || null,
        availability: opp.availability || null,
        hours_per_week: opp.hours_per_week || null,
        min_age: opp.min_age || null,
        max_age: opp.min_age || null,
        image_1: opp.image_1 || "",
        image_2: opp.image_1 || "",
        image_3: opp.image_1 || "",
        role_start_date: opp.role_start_date || null,
        role_end_date: opp.role_end_date || null,
        created_at: opp.created_at || null,
        updated_at: opp.updated_at || null,
        is_online: opp.is_online || false,
        saved: false
    }));

    // 3️⃣ Insert all records at once
    const { data, error } = await supabase
        .from("Freddymatch_opportunities")
        .insert(formattedRecords);

    if (error) console.error("Insert error:", error);
    else console.log("All records inserted:", data.length);
} catch (err) {
    console.error("Error fetching or inserting opportunities:", err);
}