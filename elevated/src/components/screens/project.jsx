import { useEffect, useState } from "react"
import React from 'react'
import ProjectDashboard from "../projectDashboard"
import * as fetchData from "../../utils/fetchData"
import { supabase } from "../../integrations/supabase/client"; 
import LoadingOverlay from "../ui/loadingOverlay";

const Project = () => {
    // screen states
    const [isLocked, setIsLocked] = useState(async () => {
        const userId = await fetchData.getUserId()
        const data = await fetchData.selectSingle("Users", "training_completed", "user_id", userId);
        setIsLocked(!data.training_completed) // create project screen is locked if training is not yet complete
    })
    const [showMessage, setShowMessage] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
        setShowMessage(true);
        }, 4000);

        return () => clearTimeout(timer); // clean up
    }, []);

    const [project, setProject] = useState(null)
    
    useEffect(() => {
        const retrieveProject = async () => {
            const userId = await fetchData.getUserId()
            const profileId = await fetchData.getProfileId(userId)
            // check if there exists a row in project_members with profile_id = user's profile_id
            const data = await fetchData.select("Project_members", "*", "profile_id", profileId);
            if (data.length > 0) {
                // for each row, check that the corresponding project is currently active 
                // (assuming max 1 project will be active for any user at any given time)
                let found = false
                data.forEach(membership => {
                    const verifyProject = async () => { 
                        const projectData = await fetchData.selectSingle("Projects", "*", "project_id", membership.project_id);
                        if (projectData.active) {
                            found = true;
                            setProject(projectData) // set project to display as the project record from DB
                        }
                    }
                    verifyProject();
                    if (found) {
                        return;
                    }
                })
            }
        }
        retrieveProject()
    }, [])

    // create project popup states
    const [openPopup, setOpenPopup] = useState(false)
    const [description, setDescription] = useState('');
    const [ngoName, setNgoName] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [members, setMembers] = useState([]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        // post new project record to Projects Table
        const { data, error } = await supabase
            .from('Projects')
            .upsert({ 
                project_name: projectTitle,
                project_description: description,
                project_ngo: ngoName,
                created_at: new Date()
            })
            .select()
        if (error) throw error;
        setProject(data) // project record to display
        // add each memmber record to Project_members table
        members.forEach(async (member) => {
            const memberProfileId = await fetchData.getProfileId(member.id)
            const { error } = await supabase
                .from('Project_members')
                .upsert({ 
                    project_id: data[0].project_id,
                    profile_id: memberProfileId
                })
            if (error) throw error;
        })
        // also insert the current user themselves as a member
        const userId = await fetchData.getUserId()
        const profileId = await fetchData.getProfileId(userId)
        const { anotherError } = await supabase
            .from('Project_members')
            .upsert({ 
                project_id: data[0].project_id,
                profile_id: profileId
            })
        if (anotherError) throw anotherError;

        setOpenPopup(false) // close popup
    };

    // invite members popup states
    const [showInvitePopup, setShowInvitePopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [invited, setInvited] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    useEffect(() => {
        const searchUsers = async () => {
            setIsSearching(true);
            const userId = await fetchData.getUserId()
            const data = await fetchData.selectLike("Users", "*", "email", searchTerm);
            const filtered = data.filter((user) => !invited.includes(user.user_id) && user.user_id != userId);
            setFilteredUsers(filtered);
            setIsSearching(false);
        }
        searchUsers();
    }, [searchTerm, invited])
    const handleInvite = (userId, name) => {
        setInvited([...invited, userId]);
        setMembers([...members, { id: userId, name: name, accepted: false}]);   
    };

    return (
        <div className="w-full min-h-full flex items-center justify-center p-6 relative">
            <LoadingOverlay full={false} />
            {project != null ? <div className="w-full h-full self-start">
                <ProjectDashboard project={project} isLocked={isLocked}/>
            </div> : 
                <div className="text-center text-sm">
                    <p>Loading...</p>
                    {showMessage && (
                        <p>
                        (If this continues, it means you have not been assigned to a project group.
                        <br/>Please contact support in the chat page.)
                        </p>
                    )}
                </div>
            }
            
        </div>
    )
}

export default Project