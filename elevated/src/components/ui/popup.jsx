import React from 'react'

const Popup = ( { setIsOpen, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full px-12 py-6 space-y-4 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">&times;</button>
            {children}                
        </div>
    </div>
  )
}

export default Popup