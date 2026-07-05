import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io'
// import Actions from '../Actions';
const Actions = {
  JOIN:"join",
  JOINED:"joined",
  DISCONNECTED:"disconnected",
  CODE_CHANGED:"code-change",
  SYNC_CODE:"sync-code",
  LEAVE:"leave"
}

dotenv.config();
const app = express();
app.use(cors());
const server = http.createServer(app);
const PORT = 3001

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/socket', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

const userSocketMap={}
const currentCodeForRooms = {};
function getAllClients(roomId){
  return Array.from(io.sockets.adapter.rooms.get(roomId)||[]).map((socketId)=>{
    return {
      socketId,
      username:userSocketMap[socketId]
    }
  })
}
function getCurrentCodeForRoom(roomId) {
  return currentCodeForRooms[roomId] || "";
}

io.on("connection", (socket) => {
  console.log("New connection ", socket.id);

    socket.on(Actions.JOIN,({roomId,username})=>{
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllClients(roomId);
        socket.emit(Actions.SYNC_CODE, { code: getCurrentCodeForRoom(roomId) });
        clients.forEach(({socketId})=>{
            io.to(socketId).emit(Actions.JOINED,{
              clients,
              username,
              socketId:socket.id
            })
        })
        
    });

    socket.on(Actions.CODE_CHANGED,({code,roomId,fileId,user,position})=>{
        currentCodeForRooms[roomId] = code;
       socket.in(roomId).emit(Actions.CODE_CHANGED,{code,fileId,user,position});
    })

    socket.on("cursor-change",({roomId,user,position})=>{
       socket.in(roomId).emit("cursor-change",{socketId:socket.id,user,position});
    })

    socket.on("file-create",({roomId,file})=>{
       socket.in(roomId).emit("file-create",{file});
    })

    socket.on("file-delete",({roomId,fileId})=>{
       socket.in(roomId).emit("file-delete",{fileId});
    })

    socket.on("file-select",({roomId,fileId})=>{
       socket.in(roomId).emit("file-select",{fileId,socketId:socket.id});
    })

    socket.on("chat-message",({roomId,message})=>{
       socket.in(roomId).emit("chat-message",{message});
    })

    socket.on("request-join", ({ roomId, username, userId, socketId }) => {
       const finalSocketId = socketId || socket.id;
       io.to(roomId).emit("join-request", { username, userId, socketId: finalSocketId });
    })

    socket.on("approve-join", ({ requesterSocketId, roomId, password }) => {
       io.to(requesterSocketId).emit("join-approved", { roomId, password });
    })

    socket.on("reject-join", ({ requesterSocketId }) => {
       io.to(requesterSocketId).emit("join-rejected");
    })

    socket.on("toggle-permission", ({ targetSocketId, isReadOnly }) => {
       io.to(targetSocketId).emit("permission-toggled", { isReadOnly });
    })

    socket.on("new-comment", ({ roomId, comment }) => {
       socket.in(roomId).emit("comment-received", { comment });
    })
  

    socket.on("disconnecting",()=>{
      const rooms = [...socket.rooms];
      rooms.forEach((roomId)=>{
        socket.in(roomId).emit(Actions.DISCONNECTED,{
          socketId:socket.id,
          username: userSocketMap[socket.id]
        });
      });
      delete userSocketMap[socket.id];
      socket.leave();
    });

});

server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});
