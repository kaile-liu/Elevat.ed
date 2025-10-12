import React from 'react'
import { useEffect, useState } from 'react';
import { GripVertical, Dot, Trash } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import * as fetchData from "../utils/fetchData"

const priorityClasses = {
  'High': {
    text: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  'Medium': {
    text: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  'Low': {
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  }
}


const DraggableCard = ({ id, setIsOpen, children, hasHandle, isDragging, draggable, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    touchAction: 'manipulation',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-full ${hasHandle ? 'h-28' : 'h-19'} ${isDragging ? 'scale-110 skew-y-1 rotate-1 shadow-md' : ''} bg-white p-3 rounded-xl hover:cursor-pointer`}
    >
      { hasHandle && draggable &&
      <div className="absolute top-3 right-1 hover:cursor-grab" {...listeners} {...attributes}>
        <GripVertical className="text-gray-400" size={16} />
      </div>
      }
      { hasHandle && draggable &&
      <Trash className="text-gray-400 absolute bottom-3 right-2 hover:cursor-pointer hover:text-gray-500" size={16} onClick={(e) => {
        e.stopPropagation()
        setShowConfirm(true);
      }}/>
      }

            {showConfirm && (
        <div className="absolute bottom-8 right-0 bg-white border-2 border-green-med-dark/25 shadow-lg rounded-md p-2 text-sm z-50">
          <p className="mb-2">Delete this task?</p>
          <div className="flex justify-end gap-2">
            <button
              className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(false);
              }}
            >
              Cancel
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowConfirm(false);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

const TaskCard = ({ task, isDragging=false, isSmall=false, draggable, onDelete }) => {
    const [assignees, setAssignees] = useState([]);
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        const fetchAssigneeData = async () => {
        try {
            const assigneesData = await fetchData.select("Project_task_assignees", "*", "task_id", task.task_id);
            setAssignees(assigneesData);

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
        <DraggableCard id={task.task_id} hasHandle={!isSmall} isDragging={isDragging} draggable={draggable} onDelete={onDelete}>
            <div className={`text-xs ${priorityClasses[task.priority].text} ${priorityClasses[task.priority].bg} w-fit px-2 py-1 rounded-md font-semibold mb-1`}>
                {task.priority}
            </div>
            <p className="font-semibold text-sm line-clamp-1">{task.task_title}</p>
            {!isSmall && <p className="text-xs text-gray-500 line-clamp-2 pr-2">{task.task_description}</p>}
            <div className='absolute top-2 right-6 flex gap-0.5'>
                {!isSmall && profiles.map((profile) => (
                <div key={profile.profile_id} className='relative group'>
                    <p className='absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-white/90 text-xs text-black px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition'>{profile.name}</p>
                    <img src={profile.pfp ? profile.pfp : '/profile.png'} alt={profile.name} className={`object-cover w-6 h-6 rounded-full`}/>
                </div>
                ))}
            </div>
        </DraggableCard>
    )
}

export default TaskCard