import React, { useEffect, useState } from 'react'
import { supabase } from "../integrations/supabase/client"
import * as fetchData from "../utils/fetchData"

const HeaderBar = ( { setIsProfileBarOpen } ) => {
     const [profilePic, setProfilePic] = useState('/profile.png')
      useEffect(() => {
        const fetchProfilePicture = async () => {
          const userId = await fetchData.getUserId()
          const { data, error } = await supabase
            .from('Users')
            .select('pfp') 
            .eq('user_id', userId)
            .single()
          if (error) {
            console.error('Fetch error:', error)
            return
          }
          setProfilePic(data.pfp)
          console.log(data)
        }
        fetchProfilePicture()
      }, [])

  return (
    <div className='flex items-center justify-between p-4 bg-green-light border-b-green-med-dark/25 border-b-2 w-full h-full'>
        <div className="flex gap-2 items-center justify-center">
            <img className="w-8" src='/elevated_logo.png' alt='logo'></img>
            <p className="text-xl font-semibold text-green-full">Elevat.ed</p>
        </div> 
        <div className='flex gap-4 items-center h-fit'>
            <div className='flex gap-1 items-center'>
                <img src='/points.png' className='w-5 h-5'></img>
                <p className='text-md text-green-dark/85 font-medium'>240</p>
            </div>
            <img src='/notifications.png' className='w-5 h-5'></img>
            <div className='flex gap-2 items-center'>
                <img src={profilePic} className="w-8 mx-auto rounded-full"></img>
                <p className='font-medium text-sm text-green-dark/85'>Brandon James</p>
                <img src='/chevron-down.png' className='w-4 h-4 cursor-pointer' onClick={() => setIsProfileBarOpen(open => !open)}></img>
            </div>
        </div>
    </div>
  )
}

export default HeaderBar