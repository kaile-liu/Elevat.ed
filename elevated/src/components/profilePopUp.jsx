import React, {useState, useEffect} from 'react'
import * as fetchData from "../utils/fetchData"
import Popup from './ui/popup'

const ProfilePopUp = ( { profile, setIsOpen } ) => {
    const [pos, setPos] = useState('')

    useEffect(() => {
    const fetchProjectData = async () => {
        // fetch USERS
        const userId = await fetchData.getUserId()
        const currentUser = await fetchData.selectSingle("Users", "*", "user_id", userId)
        const allUsers = await fetchData.select("Users", "*", "school", currentUser.school, 'points', false)
        const allStudents = allUsers.filter(user => user.role == 'Student');
        for (let i = 0; i < allStudents.length; i++) {
            if (allStudents[i].profile_id === profile.profile.profile_id) {
                setPos(i+1)
                break;
            }
        }
    }
    fetchProjectData()
    }, [])

  return (
    <Popup setIsOpen={setIsOpen}>
        <div className='flex flex-col justify-start items-center gap-4 h-full'>
            <div>
                <img src={profile.profile.pfp ? profile.profile.pfp : '/profile.png'} className="w-24 h-24 mx-auto object-cover rounded-full"></img>
                <div className='flex -mt-4'>
                    <img src='/research-badge.png' className='w-10 h-10'></img>
                    <img src='/team-mvp-badge.png' className='w-10 h-10 -ml-3'></img>
                    <img src='/presentation-badge.png' className='w-10 h-10 -ml-3'></img>
                </div>
            </div>

            <p className='font-medium text-green-dark'>{profile.profile.name}</p>

            <div className='grid grid-cols-2 grid-rows-2 gap-4 w-full h-40'>
                <div className='bg-green-light w-full h-full rounded-xl flex justify-start items-center gap-2 p-4'>
                    <img src='/leaderboard-position.png' width={32}/>
                    <div>
                        <p className='font-medium text-md'>{pos}</p>
                        <p className='font-light text-xs'>Leaderboard position</p>
                    </div>
                </div>
                <div className='bg-green-light w-full h-full rounded-xl flex justify-start items-center gap-2 p-4'>
                    <img src='/endorsements.png' width={32}/>
                    <div>
                        <p className='font-medium text-md'>{profile.profile.endorsements}</p>
                        <p className='font-light text-xs'>Endorsements received</p>
                    </div>
                </div>
                <div className='bg-green-light w-full h-full rounded-xl flex justify-start items-center gap-2 p-4'>
                    <img src='/points.png' width={32}/>
                    <div>
                        <p className='font-medium text-md'>{profile.profile.points}</p>
                        <p className='font-light text-xs'>Total points</p>
                    </div>
                </div>
                <div className='bg-green-light w-full h-full rounded-xl flex justify-start items-center gap-2 p-4'>
                    <img src='/badge.png' width={32}/>
                    <div>
                        <p className='font-medium text-md'>3</p>
                        <p className='font-light text-xs'>Badges received</p>
                    </div>
                </div>
            </div>
        </div>
    </Popup>
  )
}

export default ProfilePopUp