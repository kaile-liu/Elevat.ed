import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Below is the Supabase project URL and Service Role Key.
// Note: The Service Role Key should NEVER be exposed on the client side.
const supabaseUrl = 'https://txgfvqffljglhgfwrwxn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const test_users = [
    {
        email: 'testmentor@example.com',
        password: 'testpassword'
    },
    // {
    //     email: 'testuser2@example.com',
    //     password: 'qansc9q*!UIASN'
    // },
    // {
    //     email: 'testuser3@example.com',
    //     password: 'KOkas9(N)AwsA'
    // },
    // {
    //     email: 'testuser4@example.com',
    //     password: 'AS%^7dc&Ascasd'
    // },
    // {
    //     email: 'testuser5@example.com',
    //     password: 'asdjnasd-A&aisbc'
    // }]
//     {
//         email: 'testuser6@example.com',
//         password: 'qansc9q*42!UIASN'
//     },
//     {
//         email: 'testuser7@example.com',
//         password: 'KOka12s9(N)AwsA'
//     },
//     {
//         email: 'testuser8@example.com',
//         password: 'AS%^7dc&Ascasasd'
//     },
//     {
//         email: 'testuser9@example.com',
//         password: 'asdjna14sd-A&aisbc'
//     },
//     {
//         email: 'testuser10@example.com',
//         password: 'asdjasdnasd-A&aisbc'
//     },
//     {
//         email: 'testuser11@example.com', //mentor
//         password: 'asdjnasd-A&aisb134c'
//     },
// {
//         email: 'testuser12@example.com',
//         password: 'asdjnasd-A&aisabc'
//     },
// {
//         email: 'testuser13@example.com',
//         password: 'asdjnasd-A&aisbasdc'
//     }
]

test_users.forEach(user => createTestUser(user))

async function createTestUser( { email, password } ) {

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
    name: 'Test User',
    email: email,
    role: 'Student',
    school: 'Frankfurt International School',
    created_at: new Date()
    },
    ]);
    if (profileError) {
        console.error('Error inserting into custom users table:', profileError);
    } else {
        console.log('User profile created successfully:', profileData);
    }

    [11, 12, 13].forEach(async id => {
        fetch('https://elevat-ed.onrender.com/slack/create-channel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ channelName: `mentor-${id}` }),
            })
            .then(response => response.json())
            .then(data => console.log('Success:', data))
            .catch(error => console.error('Error:', error));
    })

}