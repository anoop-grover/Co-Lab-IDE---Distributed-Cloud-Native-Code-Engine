import React, { useState } from "react";
<<<<<<< HEAD
import useRoomService from '../hooks/useRoom'
=======
import useRooomService from '../hooks/useRoom'
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
import { useAppSelector } from "../app/hooks";
import { notify } from "../utils/notify";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { SparklesCore } from "../components/ui/sparkles";

const JoinRoom = () => {
    const user = useAppSelector((state) => { return state.auth.user });
    const navigate = useNavigate();
    const { createRoom, joinRoom } = useRoomService()
    const [roomId, setRoomId] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [create, setCreate] = useState<boolean>(true);

=======

import { BsEye, BsEyeSlash } from "react-icons/bs";

const JoinRoom = () => {
    const user = useAppSelector((state)=>{return state.auth.user});
    const navigate = useNavigate();
    const {createRoom,joinRoom} = useRooomService()
    const [roomId, setRoomId] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [create, setCreate] = useState<boolean>(true);
    
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
    const handleToggle = () => {
        setCreate(!create);
        setRoomId("");
        setPassword("");
    };
<<<<<<< HEAD

    const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (!user) {
                notify("Not Allowed to create. Please Login", false);
                return;
            }
            if (roomId.length < 3) {
                notify("Room name must be at least 3 characters", false);
                return;
            }
            if (password.length < 4) {
                notify("Password must be at least 4 characters", false);
                return;
            }
            const res = await createRoom({ name: roomId, password, authorId: user._id, authorName: user.user_name });
            notify("Room created successfully!", true);
            setTimeout(() => {
                navigate(`/collab/${res.room._id}`);
            }, 1500)
        } catch (error: any) {
            notify(error.message || "Failed to create room", false);
        }
    }

    const handleJoinRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (!user) {
                notify("Not Allowed. Please Login", false);
                return;
            }
            const res = await joinRoom({ name: roomId, password, userId: user._id, userName: user.user_name });
            notify("Room joined successfully!", true);
            setTimeout(() => {
                navigate(`/collab/${res.room._id}`);
            }, 1500)
        } catch (error: any) {
            notify(error.message || "Failed to join room", false);
        }
    }

    return (
        <div className="h-[calc(100vh-64px)] w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
            <div className="w-full absolute inset-0 h-full">
                <SparklesCore
                    id="tsparticlesjoinroom"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={20}
                    className="w-full h-full"
                    particleColor="#6366F1"
                />
            </div>
            <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-slate-950 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]"></div>
            <Toaster />

            <div className="relative z-10 w-full max-w-4xl mx-4 p-1 bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 rounded-2xl shadow-2xl">
                <div className="flex flex-col md:flex-row bg-slate-900/90 backdrop-blur-lg rounded-2xl overflow-hidden">
                    
                    {/* Form Pane */}
                    <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
                        <form onSubmit={create ? handleCreateRoom : handleJoinRoom} className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                                    {create ? "Create collaboration room" : "Join collaboration room"}
                                </h1>
                                <p className="text-sm text-slate-400 mt-2">
                                    {create 
                                        ? "Create a password-protected environment for live programming." 
                                        : "Enter room credentials to work together in real-time."
                                    }
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Room ID / Name
                                </label>
                                <input
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                                    onChange={(e) => {
                                        setRoomId(e.target.value);
                                    }}
                                    type="text"
                                    placeholder="Enter Room Name"
                                    value={roomId}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Security Password
                                </label>
                                <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl">
                                    <input
                                        className="w-full bg-transparent text-white px-4 py-3 text-sm focus:outline-none focus:ring-0"
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                        }}
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col space-y-3 pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-600/10"
                                >
                                    {create ? "Create Room" : "Join Room"}
                                </button>
                                <button
                                    type="button"
                                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-sm border border-slate-700 transition-all duration-200"
                                    onClick={handleToggle}
                                >
                                    {create ? "Switch to Join Room" : "Switch to Create Room"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Vector / Graphics Pane */}
                    <div className="hidden md:flex w-1/2 bg-slate-950 items-center justify-center p-8 border-l border-slate-800">
                        <div className="relative w-full h-80 flex items-center justify-center">
                            <img 
                                className="w-full h-full object-contain rounded-xl opacity-90 transition-opacity duration-300 hover:opacity-100" 
                                src={create ? "/image2.png" : "/image3.png"} 
                                alt="Collaboration workspace" 
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

=======
  const handleCreateRoom = async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
        try {
            if(!user){
                notify("Not Allowed to create. Please Login",false);
                return;
            }
            const res = await createRoom({name:roomId,password,authorId:user._id,authorName:user.user_name});
            notify("Room created!",true);
            setTimeout(()=>{
                navigate(`/collab/${res.room._id}`);
            },2000)
        } catch (error:any) {
            if(error.response)
            notify(error.response.message,false);
            else notify(error.message,false);
        }
  }
  const handleJoinRoom = async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    try {
        if(!user){
            notify("Not Allowed to create. Please Login",false);
            return;
        }
        const res = await joinRoom({name:roomId,password,userId:user._id,userName:user.user_name});
        notify("Room joined sucessfully",true);
        setTimeout(()=>{
            navigate(`/collab/${res.room._id}`);
        },2000)
    } catch (error:any) {
        if(error.response)
        notify(error.response.message,false);
        else notify(error.message,false);
    }
  }
  return (
    <div className="h-[70vh] bg-black">
        <Toaster/>
      <h1 className="text-5xl text-center text-white font-bold py-4">Welcome to Collaboration Mode</h1>
      {create
        ? Form({
            title:"Create a Room",
            handleToggle,
            buttonText: "Create",
            button2Text: "Join a room",
            setPassword,
            setRoomId,
            password,
            roomId,
            imageUrl: "image2.png",
            handleSubmit:handleCreateRoom
          })
        : Form({
            title:"Join a Room",
            handleToggle,
            buttonText: "Join",
            button2Text: "Create a room",
            setPassword,
            setRoomId,
            password,
            roomId,
            imageUrl: "image3.png",
            handleSubmit:handleJoinRoom
          })}
    </div>
  );
};

//FORM COMPONENT
const Form = ({
    title,
  handleToggle,
  buttonText,
  button2Text,
  imageUrl,
  setPassword,
  setRoomId,
  roomId,
  password,
  handleSubmit,
}: {
    title:string,
  handleToggle: () => void;
  buttonText: string;
  button2Text: string;
  imageUrl: string;
  setRoomId: React.Dispatch<React.SetStateAction<string>>;
  roomId: string;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit:(e:React.FormEvent<HTMLFormElement>)=>void;
}) => {
  const [showPassword,setShowPassword] = useState(false);
  return (
    <div className="flex justify-center items-center">
      <form onSubmit={handleSubmit} className="flex flex-col ">
        <h1 className="text-3xl text-white">{title}</h1>
        <input
          className="px-2 py-1 rounded-md text-lg my-2 bg-transparent border border-slate-300 text-white outline-none"
          onChange={(e) => {
            setRoomId(e.target.value);
          }}
          type="text"
          placeholder="Room ID"
          value={roomId}
        />
        <div className="px-2 py-1 flex items-center rounded-md  bg-transparent  text-lg my-2 border text-white border-slate-300 outline-none">
        <input
          className="bg-transparent outline-none"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          type={showPassword?"text":"password"}
          placeholder="Password"
          value={password}
        />
        <button type="button" onClick={()=>{setShowPassword((showPassword)=>{return !showPassword})}} className="text-white">{showPassword?<BsEye height={"20"} />:<BsEyeSlash/>}</button>
        </div>
      
        <input
          className="bg-green-600 rounded-md text-white py-1 px-2 my-2 cursor-pointer hover:bg-green-700"
          type="submit"
          value={buttonText}
        />
        <button
          type="button"
          className="bg-blue-600 rounded-md text-white py-1 px-2 my-2"
          onClick={handleToggle}
        >
          {button2Text}
        </button>
      </form>
      <img className="h-96 w-96 object-cover" src={imageUrl} alt="image" />
    </div>
  );
};
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
export default JoinRoom;
