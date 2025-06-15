import React, { useState } from 'react';

const Chat = () => {
  const [selectedTab, setSelectedTab] = useState('Mentors');

  const tabs = ['Mentors', 'Project Team', 'Everyone'];

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='h-12 w-full'>
        <div className='flex items-end justify-start gap-4 bg-green-med-dark/10 border-b-2 border-b-green-med-dark/25 w-full h-full px-4 text-sm font-medium'>
          {tabs.map(tab => (
            <p
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`cursor-pointer pb-2 transition-all ${
                selectedTab === tab ? 'border-b-3 border-green-full text-green-full' : 'border-b-3 border-transparent'
              }`}
            >
              {tab}
            </p>
          ))}
        </div>
      </div>

      <div className="grow flex w-full h-full relative">
        {/* You can add messages or chat view logic here */}
      </div>
    </div>
  );
};

export default Chat;
