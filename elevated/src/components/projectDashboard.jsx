import React from 'react';
import { DndContext } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SquarePen, Upload, FileText, ImageIcon, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as fetchData from "../utils/fetchData"
import CreateTaskPopup from './createTaskPopup';
import TaskCard from './taskCard';
import ProjectChat from './projectChat';
import { supabase } from '../integrations/supabase/client';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // Replace with your server URL

const DraggableCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 rounded-xl border-2 border-green-light mb-3 shadow-sm hover:cursor-grab"
    >
      {children}
    </div>
  );
};

const DroppableColumn = ({ id, title, count, color, children }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="bg-green-light rounded-lg p-3 min-h-[160px]">
      <h4 className={`font-semibold text-sm mb-2 text-${color}-600`}>
        • {title} <span className="text-gray-500">({count})</span>
      </h4>
      <div className='flex gap-4 overflow-auto'>
        {children}
      </div>
    </div>
  );
};

const ProjectDashboard = ( { project } ) => {
  const [files, setFiles] = useState([]);
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [links, setLinks] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const addLink = () => {
    if (linkInput && isValidUrl(linkInput)) {
      setLinks((prev) => [...prev, linkInput]);
      setLinkInput("");
    }
  };
  const removeLink = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };


  // store project states below
  const [user, setUser] = useState({})
  const [teamMembers, setTeamMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [openPopup, setOpenPopup] = useState(false)
  // task stored here in lists
  const [columns, setColumns] = React.useState({
    todo: [],
    inprogress: [],
    done: [],
  });

  // send messgae to Slack Channel via the '/slack/send-message' endpoint
  const handleMessage = async (messageText, profile_id) => {
    try {
      const response = await fetch('http://localhost:3000/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project.project_id,
          text: messageText,
          profile_id: profile_id
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

  // fetch members, tasks, chat messages etc here and store in states above
  useEffect(() => {
    const fetchProjectData = async () => {
      // fetch USER
      const userId = await fetchData.getUserId()
      const user = await fetchData.selectSingle("Users", "*", "user_id", userId)
      setUser(user)

      // fetch MEMBERS
      const teamMembers = await fetchData.select("Project_members", "*", "project_id", project.project_id)
      const memberProfiles = await Promise.all(teamMembers.map(async (member) => ({
        member: member,
        profile: await fetchData.selectSingle("Users", "*", "profile_id", member.profile_id),
      })))
      console.log(memberProfiles)
      setTeamMembers(memberProfiles)

      // fetch TASKS
      const projectTasksData = await fetchData.select("Project_tasks", "*", "project_id", project.project_id)
      console.log(projectTasksData)
      // Create a copy of the empty columns on component mount
      const updatedColumns = {
        todo: [],
        inprogress: [],
        done: [],
      };
      // Fill the correct arrays
      projectTasksData.forEach(task => {
        if (task.status in updatedColumns) { // prevent errors
          updatedColumns[task.status].push(task);
        }
      });
      // update state once
      setColumns(updatedColumns);

      // fetch MESSAGES
      try {
        const response = await fetch(`http://localhost:3000/slack/messages?project_id=${project.project_id}`);
        if (!response.ok) {
          throw new Error(`Error fetching messages: ${response.statusText}`);
        }
        const data = await response.json();
        setMessages(data.messages) // array of messages
      } catch (err) {
        console.error('Failed to fetch Slack messages:', err);
      }
    }
    fetchProjectData()
    
    // listen to web socket events for new messages
    socket.on('new_message', (msg) => {
      console.log('web socket event detected, message: ', msg)  
      if (msg.project_id === project.project_id) {
          setMessages(prev => [...prev, msg.message]); // update messages state with new messages
        }
    });

    return () => {
      socket.off('new_message');
    };
  }, [])

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const sourceCol = Object.keys(columns).find((colId) =>
      columns[colId].some((task) => task.task_id === active.id)
    );

    const destinationCol = over.id;

    if (sourceCol && destinationCol && sourceCol !== destinationCol) {
      setColumns((prev) => {
        // update local state
        const taskToMove = prev[sourceCol].find((task) => task.task_id === active.id);
        if (!taskToMove) return prev;
      
        const newSource = prev[sourceCol].filter((task) => task.task_id !== active.id);
        const newDestination = [...prev[destinationCol], taskToMove];
      
        return {
          ...prev,
          [sourceCol]: newSource,
          [destinationCol]: newDestination,
        };
      });

      const updateStatus = async () => {
        console.log('status destination: ', destinationCol, 'for task: ', active.id)
        const taskToUpdate = columns[sourceCol].find(task => task.task_id === active.id);
        if (!taskToUpdate) return;
        try {
          // Update the status in Supabase
          await fetchData.update("Project_tasks", { status: destinationCol }, "task_id", active.id);
        } catch (error) {
          console.error("Failed to update task status in Supabase:", error);
        }
      }
      updateStatus()
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col md:flex-row gap-6 h-screen max-h-screen">
        {openPopup && <CreateTaskPopup onClose={() => setOpenPopup(false)} teamMembers={teamMembers} project={project} setColumns={setColumns}
          />}
        {/* Left Section */}
        <div className="flex-1 flex flex-col relative max-h-[90vh]">
          {/* Project Info */}
          <div className="bg-white p-4 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold">
              {project.project_name}
            </h2>
            <p className="text-sm mt-1"><strong>NGO:</strong> {project.project_ngo}</p>
            <p className="mt-2 text-sm text-gray-700">
              <strong>Description:</strong> {project.project_description}
            </p>
            <p className="mt-2 text-sm">
              <strong>Upcoming deadline:</strong> Mid-term presentation <span className="text-green-full font-semibold">due 25/05/25</span>
            </p>
          </div>

          {/* Tasks Section */}
          <div className="bg-white p-4 rounded-xl shadow flex-1 flex flex-col max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Project Tasks</h3>
              <button className="bg-green-full text-white text-sm px-4 py-1 rounded-full hover:bg-green-full/75" onClick={() => setOpenPopup(true)}>Create Task +</button>
            </div>

            <div className="grid md:grid-cols-1 md:grid-rows-3 gap-4 flex-1 max-h-full">
              {['todo', 'inprogress', 'done'].map((columnId) => {
                const columnTitle = {
                  todo: 'To Do',
                  inprogress: 'In Progress',
                  done: 'Done',
                }[columnId];

                const columnColor = {
                  todo: 'blue',
                  inprogress: 'yellow',
                  done: 'green',
                }[columnId];

                return (
                  <DroppableColumn
                    key={columnId}
                    id={columnId}
                    title={columnTitle}
                    count={columns[columnId].length}
                    color={columnColor}
                    className='overflow-y-auto'
                  >
                    {columns[columnId].map((task) => (
                      <TaskCard task={task}/>
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Deliverables + Chat */}
        <div className="w-full md:w-[300px] flex flex-col h-fill gap-6">
          {/* Deliverables */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold">Upload deliverables</h3>
            {/* File upload */}
            <label className="block mb-2 text-sm font-medium text-gray-700 cursor-pointer">
              <span className="flex items-center gap-2">
                Upload files (PDFs or Images)
                <Upload width={16} className="hover:opacity-75" />
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* File Preview List */}
            {files.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {/* File Type Icon */}
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-gray-500" />
                      )}

                      {/* File name */}
                      <span className="text-sm text-gray-800">{file.name}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* View button for PDFs */}
                      {file.type === "application/pdf" && (
                        <a
                          href={URL.createObjectURL(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline"
                        >
                          View
                        </a>
                      )}

                      {/* Remove file */}
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className='text-sm text-gray-500'>No files to preview</p>}

            {/* Link submission */}
            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Submit a link (e.g., Google Docs, Slides)
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={addLink}
                className="px-4 py-2 bg-none text-gray-600 rounded-lg hover:text-gray-400 transition text-sm"
              >
                Add
              </button>
            </div>

            {/* Preview links */}
            <ul className="mt-3 space-y-2">
              {links.length > 0 ? links.map((link, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                >
                  <span className="text-sm text-blue-700 truncate max-w-xs">{link}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => removeLink(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              )) : <p className='text-sm text-gray-500'>No links to preview</p>}
            </ul>

            {/* Submit button */}
            <button
              type="button"
              className="mt-4 bg-green-full text-white text-sm px-4 py-1 rounded-full hover:bg-green-full/75"
            >
              Submit Deliverables
            </button>
          </div>

          {/* Chat */}
          <ProjectChat project={project} user={user} onMessage={handleMessage} messages={messages}/>
          
        </div>
      </div>
    </DndContext>
  );
};

export default ProjectDashboard;
