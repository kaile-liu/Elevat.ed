import React from 'react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as fetchData from "../utils/fetchData"

const priorityColours = { // predefined colours for task priorities
    'High': 'red-500',
    'Medium': 'orange-500',
    'Low': 'yellow-500'
}
const taskStatus = {
    'todo': 'To Do',
    'inprogress': 'In Progress',
    'done': 'Done',
}
const statusColor = {
    'todo': 'blue-500',
    'inprogress': 'yellow-500',
    'done': 'green-500',
}

const TaskDetailsPopup = ({ task, onClose }) => {
    const [assignees, setAssignees] = useState([]);
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        const fetchAssigneeData = async () => {
        try {
            const assigneesData = await fetchData.select("Project_task_assignees", "*", "task_id", task.task_id);
            setAssignees(assigneesData);
            console.log(assigneesData)

            // Fetch all profiles in parallel
            const profilePromises = assigneesData.map(async (assignee) => {
                const profile_id = await fetchData.selectSingle("Project_members", "profile_id", "project_member_id", assignee.project_member_id);
                const profile = await fetchData.selectSingle("Users", "*", "profile_id", profile_id.profile_id);
                return profile;
            });
            const resolvedProfiles = await Promise.all(profilePromises);
            setProfiles(resolvedProfiles);
        } catch (error) {
            console.error("Failed to fetch assignees:", error);
        }
        };

        fetchAssigneeData();
    }, []);

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex justify-center items-center">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">

        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">&times;</button>
        <div className='flex items-center gap-2'>
            <p className='text-xs font-semibold mb-4'>Priority:<span className={`text-${priorityColours[task.priority]} bg-${priorityColours[task.priority]}/10 w-fit px-2 py-1 rounded-md mb-1 ml-1 font-medium`}>
                {task.priority}
            </span></p>
            <p className='text-xs font-semibold mb-4'>Status: <span className={`text-${statusColor[task.status]} bg-${statusColor[task.status]}/10 w-fit px-2 py-1 rounded-md mb-1 ml-1 font-medium`}>
                {taskStatus[task.status]}
            </span></p>
        </div>
        <p className="font-semibold text-md mb-2">Task: {task.task_title}</p>
        <p className="text-xs text-gray-500 line-clamp-3 mb-4">{task.task_description}</p>
        <div className='flex items-center gap-0.5'>
            <p className='text-xs font-semibold mr-2'>Assigned to:</p>
            {profiles.map((profile) => (
            <div key={profile.profile_id} className='relative group'>
                <p className='absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-white/90 text-xs text-black px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition'>{profile.name}</p>
                <img src={profile.pfp} alt={profile.name} className={`object-cover w-8 h-8 rounded-full`}/>
            </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default TaskDetailsPopup;
