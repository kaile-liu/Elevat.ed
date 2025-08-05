import { useEffect, useRef, useState } from 'react';
import * as fetchData from '../utils/fetchData'
import * as notifications from "../utils/notifications"
import { gsap } from 'gsap';

// const badges = [
//   { id: 'mvp', name: 'Team MVP', color: 'bg-green-500', icon: '🏆' },
//   { id: 'presentation', name: 'Presentation Expert', color: 'bg-blue-500', icon: '💡' },
//   { id: 'research', name: 'Research Guru', color: 'bg-purple-500', icon: '📚' }
// ];

// const teamMembers = [
//   { id: 1, name: 'Kory Andrews' },
//   { id: 2, name: 'Megan Berry' },
//   { id: 3, name: 'Jen Busch' },
//   { id: 4, name: 'Rob Dumigan' },
//   { id: 5, name: 'Sam Fields' }
// ];

export default function BadgePopup({ isOpen, setIsOpen, members, setSnackbarOpen, setSnackbarMessage }) {
  const [step, setStep] = useState(1);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');
  const [badges, setBadges] = useState([])
  const [badgeGroups, setBadgeGroups] = useState({})

  useEffect(() => {
    const fetchBadgeData = async () => {
        console.log(members)
        const fetchBadges = await fetchData.selectNoQuery('Badges', '*', null, null)
        console.log(fetchBadges)
        setBadges(fetchBadges)

        const grouped = {};
        console.log('grouping...')
        // Initialize each badge group with its full badge object and an empty members list
        fetchBadges.forEach(badge => {
          grouped[badge.badge_id] = {
            badge,
            members: []
          };
        });
        // Loop through each member
        members.forEach(member => {
          console.log(members)
          const badgeIds = member.badges ?? [];

          badgeIds.forEach(badgeId => {
            if (grouped[badgeId]) {
              grouped[badgeId].members.push(member);
            }
          });
        });
        setBadgeGroups(grouped);
        console.log('groups:', grouped)
    }   
    fetchBadgeData()
  }, [])

  const step1Ref = useRef();
  const step2Ref = useRef();

  useEffect(() => {
    if (step === 1 && step1Ref.current) {
      gsap.fromTo(step1Ref.current, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 });
    }
    if (step === 2 && step2Ref.current) {
      gsap.fromTo(step2Ref.current, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 });
    }
  }, [step]);

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setStep(2);
  };

  const handleAssign = async () => {
    console.log({ selectedBadge, selectedUser, reason });

    const previous = await fetchData.selectSingle('Users', '*', 'profile_id', selectedUser.profile_id)
    const currentBadges = previous.badges ?? []; // fallback if null
    const updatedBadges = [...currentBadges, selectedBadge.badge_id];
    const updatedPoints = previous.points + selectedBadge.points
    fetchData.update('Users', {points: updatedPoints, badges: updatedBadges}, 'profile_id', selectedUser.profile_id)
    notifications.createNotification(selectedUser.profile_id, 'Congratulations! You earned a new badge!', `Your mentor assigned you the ${selectedBadge.name} badge. (+${selectedBadge.points})`, selectedBadge.icon, false)
    
    setSnackbarMessage(`You have successfully assigned ${selectedUser.name} the ${selectedBadge.name} badge.`)
    setSnackbarOpen(true)

    setBadgeGroups(prevGroups => {
      const updatedGroup = {
        ...prevGroups[selectedBadge.badge_id],
        members: [...prevGroups[selectedBadge.badge_id].members, selectedUser]
      }
      return {
        ...prevGroups,
        [selectedBadge.badge_id]: updatedGroup
      }
    })

    setIsOpen(false);
    setStep(1);
    setSelectedBadge(null);
    setSelectedUser(null);
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative overflow-hidden">
        <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">&times;</button>

        {step === 1 && (
          <div ref={step1Ref} className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Select a badge to assign</h2>
            <div className="flex justify-center items-start gap-6">
              {badges.map(badge => (
                <div
                  key={badge.badge_id}
                  onClick={() => handleBadgeClick(badge)}
                  className={`cursor-pointer p-4 rounded-lg flex flex-col items-center justify-center ${badge.max_uses - badgeGroups[badge.badge_id].members.length == 0 ? 'opacity-50 pointer-events-none' : 'hover:scale-105 hover:bg-green-light'}  transition`}
                >
                  <img src={badge.icon}/>
                  <p className="text-md mt-2 text-center">{badge.name}</p>
                  <p className='text-xs font-medium mt-4 mb-2'>Assigned to:</p>
                  <div className='space-y-2'>
                    {badgeGroups[badge.badge_id].members.map(member => 
                      <div className='flex items-center gap-2'>
                        <img src={member.pfp ? member.pfp : 'profile.png'} className='w-8 h-8 rounded-full object-cover'/>
                        <p className='text-xs'>{member.name}</p>
                      </div>
                      
                    )}
                    {badge.max_uses - badgeGroups[badge.badge_id].members.length > 0 && [...Array(badge.max_uses - badgeGroups[badge.badge_id].members.length)].map((_, i) => 
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-full border-2 border-green-med-dark/25 border-dashed'></div>
                        <p className='text-xs'>No one</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div ref={step2Ref} className="space-y-4">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500">&larr; Back</button>
            <h2 className="text-lg font-semibold">Select users to assign badge</h2>
            <div className="max-h-48 overflow-y-auto">
              {members.map(user => (
                <div
                  key={user.profile_id}
                  onClick={() => setSelectedUser(user)}
                  className={`flex items-center gap-2 p-2 rounded border-b-1 border-green-med-dark/25 cursor-pointer ${selectedUser?.profile_id === user.profile_id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-100'}`}
                >
                    <img className='w-10 h-10 object-cover rounded-full' src={user.pfp ? user.pfp : '/profile.png'}/>
                  {user.name}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mt-4 mb-1">Reason for awarding <span className="font-semibold">{selectedBadge?.name}</span></label>
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                placeholder="e.g. Took the lead on final presentation and spoke clearly and confidently."
              />
            </div>

            <button
              onClick={handleAssign}
              disabled={!selectedUser || !reason}
              className="bg-green-full text-white px-4 py-2 rounded disabled:bg-gray-300"
            >
              Assign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}