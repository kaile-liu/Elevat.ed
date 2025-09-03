import { Megaphone, Search } from "lucide-react";
import React, { useState } from "react";
import * as fetchData from '../utils/fetchData'
import ConfirmationSnackbar from './ui/ConfirmationSnackbar';
import * as notifications from "../utils/notifications"

const AnnouncementPopup = ({ schools }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const filteredSchools = Object.keys(schools || {}).filter(s =>
    s.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSchools(filteredSchools);
    } else {
      setSelectedSchools([]);
    }
  };

  const toggleSchoolSelection = (school) => {
    setSelectedSchools(prev =>
      prev.includes(school) ? prev.filter(s => s !== school) : [...prev, school]
    );
  };

  const handleSend = async () => {
    // insert into announcements table + send all students in the school(s) a notification
    // code here ...
    await fetchData.insert('Announcements', {title: announcementTitle, text: announcementText, schools: selectedSchools})
    try {
        for (const school of selectedSchools) {
            const projects = schools[school]; // object: project_id → { project, members }
            for (const projectId in projects) {
                const { members } = projects[projectId];
                for (const student of members) {
                await notifications.createNotification(
                    student.profile_id,                // target student
                    "📢 New Announcement",             // notification title
                    announcementText,                  // preview / announcement body
                    "/megaphone.png",                       // icon (or any string you want)
                    null                               // optional action, set if needed
            );
        }}}
    console.log("✅ Notifications sent for announcement");
  } catch (err) {
    console.error("❌ Failed to send notifications:", err);
  }

    setIsModalOpen(false);
    setStep(1);
    setAnnouncementText("");
    setSelectedSchools([]);
    setSelectAll(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsModalOpen(true)}
         className="fixed bottom-20 right-8 w-16 h-16 rounded-full bg-green-full hover:bg-green-full/90 flex items-center justify-center shadow-lg text-white 
             transition-transform duration-300 transform hover:scale-115 hover:rotate-8"
      >
        <Megaphone size={24} className="transition-transform duration-300" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>

            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold mb-4">New Announcement</h2>
                <input 
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="E.g. Welcome to ElevatEd!"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none mb-4"
                />
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Type your announcement here..."
                  className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:outline-none resize-none"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!announcementText.trim()}
                    className="bg-green-full text-white px-4 py-2 rounded-lg hover:bg-green-full/90 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-semibold mb-4">Select Schools</h2>

                {/* Search bar */}
                <div className="flex items-center gap-2 mb-3">
                  <Search size={18} className="text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:outline-none"
                  />
                </div>

                {/* Select All */}
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="text-sm">Select All</span>
                </label>

                {/* School list */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {filteredSchools.length > 0 ? (
                    filteredSchools.map((school) => (
                      <label key={school} className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={selectedSchools.includes(school)}
                          onChange={() => toggleSchoolSelection(school)}
                        />
                        <span className="text-sm">{school}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No schools found</p>
                  )}
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={selectedSchools.length === 0}
                    className="bg-green-full text-white px-4 py-2 rounded-lg hover:bg-green-full/90 disabled:opacity-50"
                  >
                    Send Announcement
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementPopup;
