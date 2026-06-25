import React from "react";
import { useNavigate } from "react-router-dom";
import { ImExit } from "react-icons/im";

interface Props {
  roomName: string;
  roomPassword: string;
  setShowModal: any;
  participants: { username: string; socketId: string }[];
}

const RoomDetailsModal: React.FC<Props> = ({
  roomName,
  roomPassword,
  setShowModal,
  participants,
}) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white tracking-wide">Room Details</h2>
          <button 
            onClick={() => setShowModal(false)}
            className="text-slate-400 hover:text-white transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Room Name</span>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium select-all">
              {roomName}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Password</span>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 font-mono font-medium select-all tracking-wider">
              {roomPassword}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Collaborators ({participants.length})</span>
            <div className="max-h-36 overflow-y-auto bg-slate-950/50 border border-slate-850 rounded-xl p-3 space-y-1.5 font-sans">
              {participants && participants.length > 0 ? (
                participants.map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-medium text-xs">{p.username}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 italic text-xs">No active collaborators.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/40 border-t border-slate-800 flex justify-end space-x-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 rounded-xl border border-slate-800 transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              navigate("/collab");
            }}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 flex items-center space-x-2 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-red-555/10"
          >
            <span>Leave Room</span>
            <ImExit size={12} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoomDetailsModal;
