import React, { useState } from 'react'
import * as rewards from "../utils/rewards"
import { useTour } from '@reactour/tour'

const GetStartedTasks = ( { user } ) => {
    const { setCurrentStep, currentStep, setIsOpen } = useTour();
    const [completed, setCompleted] = useState(() => {
        const done = Array.isArray(user.get_started_tasks_complete) ? user.get_started_tasks_complete : [];
        return [1, 2, 3, 4].map(id => done.includes(id));
        });
    const [taskAnchor, setTaskAnchor] = useState(null);
    const tasks = rewards.getStartedTasks 

    return (
        <div className="p-4 w-md">
            <p className="font-semibold text-green-dark mb-2">Get Started Tasks <span className='pl-2 font-medium'>{completed.filter(x => x).length}/4</span></p>
            <div className="flex flex-col gap-3">
                {tasks.map((task, idx) => (
                <div key={task.id} className="flex items-center justify-between">
                    {/* Tick circle */}
                    <div className="flex items-center gap-2">
                    <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        completed[idx]
                            ? "bg-green-full border-green-full text-white"
                            : "bg-gray-200 border-gray-300"
                        }`}
                    >
                        {completed[idx] && <span className="text-xs">✓</span>}
                    </div>
                    <p className="text-sm">{task.label}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                    
                    <button
                        className='bg-green-full text-white px-4 py-1 rounded-md'
                        onClick={() => {
                        switch (task.id) {
                            case 1:
                            setCurrentStep(0);
                            setIsOpen(true)
                            break
                            case 2:
                            document.getElementById('project-page-btn').click()
                            break
                            case 3:
                            document.getElementById('chat-page-btn').click()
                            break
                            case 4:
                            handleStepFour()
                            break
                        }  

                        setTaskAnchor(null)
                        }}
                    >
                        {task.action}
                    </button>
                    <span className='flex items-center text-sm !text-green-dark/80'>+{task.reward} <img className='h-6 w-6' src='/points.png'/></span>
                    </div>
                </div>
                ))}
            </div>
        </div>
    )
}

export default GetStartedTasks