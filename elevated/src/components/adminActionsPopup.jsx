import { Settings } from "lucide-react";
import React, { useState } from "react";
import * as fetchData from '../utils/fetchData'

const AdminActionsPopup = ( { selectedProject } ) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState('Unlock Project');
    const tabs = ['Unlock Project', 'Create Event'];

    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [description, setDescription] = useState("");
    
    const unlockProject = async () => {
        console.log(selectedProject)
        await fetchData.update('Projects', {is_locked: !selectedProject.is_locked}, 'project_id', selectedProject.project_id)
        setIsModalOpen(false)
    }

      const handleSubmit = async (e) => {
        e.preventDefault();
        //const newEvent = { title, date, startTime, endTime, description };
        //console.log("New Event:", newEvent);
        //if (onSubmit) onSubmit(newEvent);
        await fetchData.insert('Upcoming_events', {project_id: selectedProject.project_id, title: title, description: description, date: date, start_time: startTime, end_time: endTime})
        // Reset form
        setTitle("");
        setDate("");
        setStartTime("");
        setEndTime("");
        setDescription("");
        setIsModalOpen(false)
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed top-16 right-6 w-16 h-16 rounded-full bg-blue-full hover:bg-blue-full/90 flex items-center justify-center shadow-lg text-white 
                    transition-transform duration-300 transform hover:scale-115 hover:rotate-8"
            >
                <Settings size={24} className="transition-transform duration-300" />
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
                        {/* Close button */}
                        <button
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        onClick={() => setIsModalOpen(false)}
                        >✕</button>

                        <div className='flex items-end justify-start gap-4 border-b-2 border-b-green-med-dark/25 w-full h-full px-4 text-sm font-medium'>
                            {tabs.map(tab => (
                                <p
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`cursor-pointer pb-2 transition-all ${
                                    selectedTab === tab ? 'border-b-3 border-green-full !text-green-full' : 'border-b-3 border-transparent'
                                }`}
                                >
                                {tab}
                                </p>
                            ))}
                        </div>

                        {selectedTab == "Unlock Project" && <div className='relative w-full h-80 flex flex-col justify-center items-center gap-4'>
                            <span className="text-4xl">🔒</span>
                            <p className="text-sm text-center max-w-[40ch]">Once the project brief has been setup, click the button below to reveal it to students.</p>
                            <button className="bg-green-full px-4 py-2 text-white rounded-full hover:cursor-pointer hover:shadow-lg hover:scale-105 hover:opacity-90 transition-all"
                            onClick={unlockProject}>
                                {selectedProject.is_locked ? 'Unlock' : 'Lock'}
                            </button>
                        </div>
                        }
                        {selectedTab == "Create Event" && <div className='relative w-full h-fit pt-4'>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {/* Title */}
                                <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Event Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Mid term presentation due"
                                    required
                                    className="w-full p-3 border text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-full"
                                />
                                </div>

                                {/* Date & Time Range */}
                                <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date & Time
                                </label>
                                <div className="flex gap- items-center gap-2">
                                    <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-1/3 p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-full"
                                    />
                                    <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    className="w-1/3 p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-full"
                                    />to
                                    <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                    className="w-1/3 p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-full"
                                    />
                                </div>
                                </div>


                                {/* Description */}
                                <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief details about the event..."
                                    rows={3}
                                    required
                                    className="w-full p-3 border text-sm border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-full"
                                ></textarea>
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-full text-white rounded-md hover:cursor-pointer hover:shadow-lg hover:scale-105 hover:opacity-90 transition"
                                >
                                    Create Event
                                </button>
                                </div>
                            </form>
                        </div>
                        }

                    </div>
                </div>
            )}
        </>
    )
}

export default AdminActionsPopup