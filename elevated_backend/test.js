import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Below is the Supabase project URL and Service Role Key.
// Note: The Service Role Key should NEVER be exposed on the client side.
const supabaseUrl = 'https://txgfvqffljglhgfwrwxn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function changeUserPassword(userId, newPassword) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error('Error updating password:', error.message);
  } else {
    console.log('Password updated successfully for user:', data.id);
  }
}

// Usage
changeUserPassword('21857e31-5deb-4be8-83f3-b27d07198fd9', 'Vivienne_elevated_123');