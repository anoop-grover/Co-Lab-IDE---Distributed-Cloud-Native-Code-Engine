import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { ApiError } from "../utils/apiError";
import { Room } from "../model/room";
import { ApiResponse } from "../utils/apiResponse";
import { SandBox } from "../model/sandbox";
import { User } from "../model/user";
import { CustomRequest } from "../types/CustomRequest";

export const createRoom =  asyncHandler(async(req:CustomRequest,res:Response)=>{
    const {name,password} = req.body;
    const author = req!.user;
    const authorId = author!._id;
    const authorName = author!.user_name;
    if(!name || !password || !authorId || !authorName )
       throw new ApiError(400,"All fields are required");
    const existedRoom = await Room.findOne({name})
    if (existedRoom)
        throw new ApiError(409, "Room with this room name already exists")
    const file = await SandBox.create({userId:authorId,title:name});
    if(!file)
        throw new ApiError(500,"Something went wrong while creating a file");
    const p = [];
    p.push({id:authorId,name:authorName});
    const newRoom = await Room.create({name,password,author:authorId,sandbox:file,participants:p});
    if(!newRoom)
        throw new ApiError(500,"Something went wrong while creating a room");
    return res.status(201).json(new ApiResponse(201,"Room created",{room:newRoom},true));
})

<<<<<<< HEAD
export const getRoomById =  asyncHandler(async(req:CustomRequest,res:Response)=>{
=======
export const getRoomById =  asyncHandler(async(req:Request,res:Response)=>{
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
    const {roomId} = req.params;
    if(!roomId )
       throw new ApiError(400,"Room Id are required");

    const room = await Room.findById(roomId);
    if(!room)
        throw new ApiError(404,"Room not found");
<<<<<<< HEAD

    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const isAuthor = room.author.toString() === userId.toString();
    const isParticipant = room.participants.some((p: any) => p.id.toString() === userId.toString());

    if (isAuthor || isParticipant) {
        return res.status(201).json(new ApiResponse(201,"Room found",{room, isAllowed: true},true));
    } else {
        const sanitizedRoom = {
            _id: room._id,
            name: room.name,
            author: room.author,
            participants: room.participants.map((p: any) => ({ name: p.name, id: p.id }))
        };
        return res.status(201).json(new ApiResponse(201,"Room found (Awaiting Admission)",{room: sanitizedRoom, isAllowed: false},true));
    }
=======
    return res.status(201).json(new ApiResponse(201,"Room found",{room},true));
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
})


export const joinRoom =  asyncHandler(async(req:CustomRequest,res:Response)=>{
    const {name,password} = req.body;
    const user = req.user;
    const userId = user!._id;
    const userName = user!.user_name;
    if(!name || !password || !userId || !userName )
       throw new ApiError(400," Values missing required");
    const userFound = await User.findById(userId);

    if(!userFound){
        throw new ApiError(404,"User not found");
    }
    const room = await Room.findOne({name});

    if(!room || room.password!==password){
        throw new ApiError(400,"Invalid credentials");
    }

    
    const p = room.participants;
<<<<<<< HEAD
    if (!p.find((e: any) => e.id.toString() === userId.toString())) {
        p.push({id:userId,name:userName});
        room.participants = p;
        await Room.findByIdAndUpdate(room._id,room);
    }
=======
    p.push({id:userId,name:userName});
    room.participants = p;
        await Room.findByIdAndUpdate(room._id,room);
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
    return res.status(201).json(new ApiResponse(201,"Room Joined",{room},true));
})
