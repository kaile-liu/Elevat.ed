import { Home, BookOpen, Briefcase, Activity, Bookmark, Users, AlignEndHorizontal } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

const Sidebar = ({ selected, setSelected, buffer=false }) => {

    const menuItems = [
        { id: "home", label: "Home", icon: <Home size={16} /> },
        { id: "learn", label: "Learn", icon: <BookOpen size={16} /> },
        { id: "project", label: "Project", icon: <Briefcase size={16} /> },
        { id: "cas", label: "CAS", icon: <Activity size={16} /> },
        { id: "trackr", label: "Trackr", icon: <Bookmark size={16} /> },
        { id: "mentors", label: "Chat", icon: <Users size={16} /> },
        { id: "leaderboard", label: "Leaderboard", icon: <AlignEndHorizontal size={16} /> },
    ];

    async function signOut() {
        const { error } = await supabase.auth.signOut()
        if (error){
        console.log('error signing out: ', error)
        }
    }

    return (
        <div className={`w-48 bg-white h-fit flex flex-col items-spread gap-4 rounded-2xl sticky top-0`}>
            

            <nav className="flex flex-col">
                {menuItems.map((item) => (
                <div
                key={item.id}
                className={`flex items-center gap-3 w-full pl-6 p-3 cursor-pointer hover:bg-blue-light transition-all ${
                selected === item.id ? "bg-blue-light   text-blue-full border-l-4 border-blue-full" : "text-gray-600"
                }`}
                onClick={() => setSelected(item.id)}>
                    {item.icon}
                    <p className="text-sm">{item.label}</p>
                </div>
                ))}
            </nav>

            {/* <div className="flex items-center gap-3 p-3 pl-8 rounded-lg cursor-pointer text-red-500 hover:bg-red-100 mt-auto"
                onClick={signOut}>
                <LogOut size={20} />
                <span>Sign Out</span>
            </div> */}

        </div>
    );
}

export default Sidebar
