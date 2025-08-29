import React from 'react'

const Learn = () => {
  return (
    <div id='learn-page' className='w-full h-full flex flex-col items-center justify-center gap-4 relative'>
        <img src='/training.png' className='w-20 h-20' />
        <p className='text-sm'>Find all your learning materials in our training platform.</p>
        <button onClick={() => window.open("https://example.com", "_self")} className='px-4 py-2 bg-green-full text-white rounded-lg text-md font-medium hover:cursor-pointer hover:shadow-lg hover:scale-105 transition'>Access Training</button>
    </div>
  )
}

export default Learn