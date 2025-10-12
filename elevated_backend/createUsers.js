import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

function generateRandomPassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Below is the Supabase project URL and Service Role Key.
// Note: The Service Role Key should NEVER be exposed on the client side.
const supabaseUrl = 'https://txgfvqffljglhgfwrwxn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function deleteUser(userId) {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Error deleting user:', error);
  } else {
    console.log('User deleted successfully:', data);
  }
}

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
        console.log('password: ', password)
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
    ])
    .select();
    if (profileError) {
        console.error('Error inserting into custom users table:', profileError);
    } else {
        console.log('User profile created successfully:', profileData);
    }

    return profileData[0]
}

// create mentor profiles
async function createMentor( email, password, name, expertise, bio, linkedin ) {
    // 1. create auth record + user record
    const user = await createAuthUser(email, password, name, 'Mentor', null)
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
    ])
    .select();
    if (profileError) {
        console.error('Error inserting into custom users table:', profileError);
    } else {
        console.log('User profile created successfully:', profileData);
    }
}

// create project
async function createProject( school, users ) {
    // 1. create project record
    const { data: projectData, error: projectError } = await supabaseAdmin
    .from('Projects')
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
    ])
    .select();
    if (projectError) {
        console.error('Error inserting into custom users table:', projectError);
    } else {
        console.log('User profile created successfully:', projectData);
    }

    // 2. add mentor and admin profiles to project_members
    // for each user to be:
    for (const user of users) {
        const { data: profileData, error: profileError } = await supabaseAdmin
        .from('Project_members')
        .insert([
        {
            project_id: projectData[0].project_id,
            profile_id: user
        },
        ])
        .select();
        if (profileError) {
            console.error('Error inserting into custom users table:', profileError);
        } else {
            console.log('User profile created successfully:', profileData);
        }    
    }

    // 3. create project channel: project-group-{project_id}
    try {
        const response = await fetch('https://elevat-ed.onrender.com/slack/create-channel', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channelName: `project-group-${projectData[0].project_id}`
            }),
        });
        if (!response.ok) {
            throw new Error(`Error sending message: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Message sent:', data.message);
        } catch (err) {
        console.error('Failed to send message:', err);
    }
}

// create a student profile
async function createStudent( student, school ) {
    const { email, name, mentor_id, project_id } = student
    const randomPassword = generateRandomPassword()
    // 1. create auth record + user record
    const user = await createAuthUser(email, randomPassword, name, 'Student', school)

    // 2. add student mentor relationship
    const { data: mentorData, error: mentorError } = await supabaseAdmin
    .from('Student_mentors')
    .insert([
    {
            mentor_id: mentor_id,
            student_id: user.profile_id
    },
    ])
    .select();
    if (mentorError) {
        console.error('Error inserting into custom users table:', mentorError);
    } else {
        console.log('User profile created successfully:', mentorData);
    }    
    // 3. create user + mentor channel: mentor-{student_mentor_id}
    try {
        const response = await fetch('https://elevat-ed.onrender.com/slack/create-channel', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channelName: `mentor-${mentorData[0].student_mentor_id}`
            }),
        });
        if (!response.ok) {
            throw new Error(`Error sending message: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Message sent:', data.message);
        } catch (err) {
        console.error('Failed to send message:', err);
    }

    // 4. add user into project_members
    const { data: projectData, error: projectError } = await supabaseAdmin
    .from('Project_members')
    .insert([
    {
            project_id: project_id,
            profile_id: user.profile_id
    },
    ])
    .select();
    if (projectError) {
        console.error('Error inserting into custom users table:', projectError);
    } else {
        console.log('User profile created successfully:', projectData);
    }   

    // 5. create user/admin channel: student-{profile_id}
    try {
        const response = await fetch('https://elevat-ed.onrender.com/slack/create-channel', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channelName: `user-${user.profile_id}`
            }),
        });
        if (!response.ok) {
            throw new Error(`Error sending message: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Message sent:', data.message);
        } catch (err) {
        console.error('Failed to send message:', err);
    }
    // 7. (delete first default messages from channels so empty chat icon can be triggered!)
}


// make a create school-channel file:  school-{school.replaceAll(‘ ‘, ‘-’)}


////////////////////////


// USAGE

// // MENTORS
// const mentors = [
//     {
//         email: 'vic.okoro8@gmail.com',
//         password: generateRandomPassword(),
//         name: 'Victor Inya Okoro',
//         expertise: 'Technology and project management', 
//         bio: 'Former Technology Architect at Accenture, specializing in cloud and analytics solutions. Experienced in technical sales and project management, contributing to strategic initiatives that delivered on stakeholder objectives.', 
//         linkedin: 'https://www.linkedin.com/in/victorokoro/'
//     },
//     {
//         email: 'mari.sinfon@gmail.com',
//         password: generateRandomPassword(),
//         name: 'Maria Sinfon',
//         expertise: 'Consultancy', 
//         bio: 'Two years of experience at EY as an ESG Forensic Integrity Services Consultant and Integrity Risk Assurance Junior Assistant. Served three years as President of the Edinburgh branch of 180 Degrees Consulting, the world’s largest social impact consultancy. Completed internships at Fidelity and Evercore.', 
//         linkedin: 'https://www.linkedin.com/in/mar%C3%ADa-in%C3%A9s-sinf%C3%B3n-1816b820b/'
//     },
//     {
//         email: 'yash.mudigonda26@gmail.com',
//         password: generateRandomPassword(),
//         name: 'Yash Mudigonda',
//         expertise: 'Consultancy', 
//         bio: 'Currently at Oliver Wyman, one of the world’s most prestigious strategy consulting firms. Former Training Director at the Edinburgh branch of 180 Degrees Consulting, the world’s largest social impact consultancy. Proud FIS alumnus.', 
//         linkedin: 'https://www.linkedin.com/in/mudigonda/'
//     }
// ]
// for (const mentor of mentors) {
//     const { email, password, name, expertise, bio, linkedin } = mentor
//     await createMentor(email, password, name, expertise, bio, linkedin)
// }

// // PROJECTS
// createProject('Frankfurt International School', [24, 19])
// createProject('Frankfurt International School', [25, 19])
// createProject('Frankfurt International School', [26, 19])

// // STUDENTS
// const students = [
//     [
//     'greta_schramm@fis.edu',
//     'jimin_ryu@fis.edu',
//     'peijie_lin@fis.edu',
//     'sumin_hong@fis.edu',
//     'helena_brandt@fis.edu',
//     'moritz_leuthaeuser@fis.edu'
//     ],
//     [
//     'silas_fusco@fis.edu',
//     'yuval_blum@fis.edu',
//     'arjun_paul@fis.edu',
//     'zeynep_durmus@fis.edu',
//     'vivienne_jeschioro@fis.edu',
//     'dila_deniz@fis.edu'
//     ],
//     [
//     'noorain_syed@fis.edu',
//     'theodor_hutter@fis.edu',
//     'arthur_mellor@fis.edu',
//     'cathrin_hofmann@fis.edu',
//     'maria_ryabtseva@fis.edu',
//     'rafael_hall@fis.edu'
//     ]
// ]   
// for (const [i, group] of students.entries()) {
//     for (const email of group) {
//         createStudent({
//             email: email, 
//             name: email.split('@')[0].split('_').join(' '), 
//             mentor_id: 4 + i, 
//             project_id: 6 + i
//         }, 'Frankfurt International School')
//     }
// }

////////////////////////////////////////////////////////////////////

createProject('Frankfurt International School', [18, 19])
createStudent({
    email: 'mdobashi@gsi.edu.qa',
    name: 'Test Account', 
    mentor_id: 3, 
    project_id: 5
}, 'Example School')

// deleteUser('0877c85f-bde3-487e-a675-2918b483391f')