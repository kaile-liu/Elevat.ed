import { Home, BookOpen, Briefcase, Activity, Bookmark, Users, AlignEndHorizontal, LogOut, Settings } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { useTour } from '@reactour/tour'

const Sidebar = ({ selected, setSelected, buffer=false }) => {
    const { setCurrentStep, currentStep } = useTour();
    
    const navSteps = {
        "project": 5,
        "trackr": 7,
        "chat": 9,
        "leaderboard": 11,
        "learn": 13,

    }

    const menuItems = [
        { id: "home", label: "Home", icon: <Home size={16} /> },
        { id: "learn", label: "Learn", icon: <BookOpen size={16} /> },
        { id: "project", label: "Project", icon: <Briefcase size={16} /> },
        // { id: "cas", label: "CAS", icon: <Activity size={16} /> },
        { id: "trackr", label: "Trackr", icon: <Bookmark size={16} /> },
        { id: "chat", label: "Chat", icon: <Users size={16} /> },
        { id: "leaderboard", label: "Leaderboard", icon: <AlignEndHorizontal size={16} /> },
        //{ id: "settings", label: "Settings", icon: <Settings size={16} /> },
    ];

    async function signOut() {
        const { error } = await supabase.auth.signOut()
        if (error){
        console.log('error signing out: ', error)
        }
    }

    return (
        <div id='sidebar-nav' className={`w-48 mt-14 bg-white h-[92vh] flex flex-col items-spread gap-4 fixed top-0 border-r-2 border-green-med-dark/25`}>
            

            <nav className="flex flex-col">
                {menuItems.map((item) => (
                <div
                key={item.id}
                id={`${item.id}-page-btn`}
                className={`flex items-center gap-3 w-full pl-6 p-3 cursor-pointer hover:bg-blue-light transition-all ${
                selected === item.id ? "bg-blue-light   text-blue-full border-l-4 border-blue-full" : "text-gray-600"
                }`}
                onClick={() => {
                    if (currentStep === navSteps[item.id]) setCurrentStep(currentStep + 1);
                    setSelected(item.id)
                    if (item.id == 'learn') window.open("https://example.com", "_self") 
                }}>
                    {item.icon}
                    <p className="text-sm">{item.label}</p>
                </div>
                ))}
            </nav>

            <div className="flex items-center gap-3 w-full pl-6 p-3 text-sm cursor-pointer text-red-500 hover:bg-red-100 mt-auto transition-all"
                onClick={signOut}>
                <LogOut size={16} />
                <span>Sign Out</span>
            </div>

        </div>
    );
}

export default Sidebar
