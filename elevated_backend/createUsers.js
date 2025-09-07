import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Below is the Supabase project URL and Service Role Key.
// Note: The Service Role Key should NEVER be exposed on the client side.
const supabaseUrl = 'https://txgfvqffljglhgfwrwxn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function createAuthUser( email, password, name, role, school ) {
    // Create a new user in Auth.users
    email = email.toLowerCase()
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Set to "true" to mark the email as confirmed.
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('Test user created:', data);
    }

    // Get the new user's ID from the created auth user record.
    const newUserId = data?.user?.id;
    if (!newUserId) {
        console.error('No user ID returned');
        return;
    }
    console.log('new id: ', newUserId);

    // Insert a corresponding row into Users table.
    const { data: profileData, error: profileError } = await supabaseAdmin
    .from('Users')
    .insert([
    {
    user_id: newUserId,
    name: name,
    email: email,
    role: role,
    school: school,
    created_at: new Date()
    },
    ]);
    if (profileError) {
        console.error('Error inserting into custom users table:', profileError);
    } else {
        console.log('User profile created successfully:', profileData);
    }

    return profileData
}

// create mentor profiles
async function createMentor( email, password, name, expertise, bio, linkedin ) {
    // 1. create auth record + user record
    const user = createAuthUser(email, password, name, 'Mentor', null)
    // 2. create mentor profile record
    const { data: profileData, error: profileError } = await supabaseAdmin
    .from('Mentors')
    .insert([
    {
    profile_id: user.profile_id,
    expertise: expertise,
    bio: bio,
    linkedin: linkedin
    },
    ]);
    if (profileError) {
        console.error('Error inserting into custom users table:', profileError);
    } else {
        console.log('User profile created successfully:', profileData);
    }
}

// create project
// 1. create project record
async function createProject( school ) {
    // Insert a corresponding row into Users table.
    const { data: profileData, error: profileError } = await supabaseAdmin
    .from('Users')
    .insert([
    {
        project_name: "This project is not yet released.",
        project_brief: "The project brief is not yet released.",
        project_ngo: "The project ngo is not yet released.",
        ngo_description: "The project ngo is not yet released.",
        school: school,
        active: true,
        is_locked: true,
        created_at: new Date(),
        project_dates: {
            "project_end_date": "2025-12-19",
            "training_end_date": "2025-09-27",
            "project_start_date": "2025-10-13",
            "training_start_date": "2025-09-08",
            "mid_term_presentation_end_date": "2025-11-24",
            "mid_term_presentation_start_date": "2025-11-10"
            },
    },
    ]);
    if (profileError) {
        console.error('Error inserting into custom users table:', profileError);
    } else {
        console.log('User profile created successfully:', profileData);
    }
}
// 2. add mentor and admin profiles to project_members

// create student profiles
// 1. create auth record
// 2. create user record
// 3. add student mentor relationship
// 4. add user into project_members
// 5. create project channel: project-group-{project_id}
// 6. create user + mentor channel: mentor-{student_mentor_id}
// 7. create user/admin channel: student-{profile_id}
// 8. (delete first default messages from channels so empty chat icon can be triggered!)

// make a create school-channel file:  school-{school.replaceAll(‘ ‘, ‘-’)}