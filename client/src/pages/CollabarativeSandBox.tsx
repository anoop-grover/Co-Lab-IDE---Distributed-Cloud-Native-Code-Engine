import React, { useEffect, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Toaster } from "react-hot-toast";
import { notify } from "../utils/notify";
import { useAppSelector } from "../app/hooks";
import SandBoxNav from "../components/SandBoxNav";
import RoomDetailsModal from "../components/RoomDetailsModal";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import useRoomService from "../hooks/useRoom";
import JSZip from "jszip";

import { IRoom } from "../types/room";
import { initSocket } from "../sockets/initSocket";
import { Actions } from "../sockets/Actions";
import ErrorBoundary from "../components/Error";

interface Participant {
  username: string;
  socketId: string;
  lineNumber?: number;
  activeFile?: string;
  isReadOnly?: boolean;
}

interface ISandboxFile {
  name: string;
  code: string;
  language: string;
}

interface ChatMessage {
  text: string;
  username: string;
  time: string;
  socketId: string;
}

const LANGUAGE_TEMPLATES: { [key: string]: string } = {
  javascript: `// ==============================================================================
//                              Co-Lab IDE JavaScript Sandbox
//               Welcome! You are ready to compile and run your JS scripts.
// ==============================================================================

console.log("Hello from Co-Lab IDE!");
`,
  python: `'''
==============================================================================
                              Co-Lab IDE Python Sandbox
               Welcome! You are ready to compile and run your Python scripts.
==============================================================================
'''

print("Hello from Co-Lab IDE!")
`,
  java: `// ==============================================================================
//                              Co-Lab IDE Java Sandbox
//               Welcome! You are ready to compile and run your Java class.
// ==============================================================================

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Co-Lab IDE!");
    }
}
`,
  cpp: `/******************************************************************************
                              Co-Lab IDE C++ Sandbox
               Code, Compile, Run and Debug C++ program online.
Write your code in this editor and press "Run" button to compile and execute it.
*******************************************************************************/

#include <iostream>

int main()
{
    std::cout << "Hello from Co-Lab IDE!" << std::endl;
    return 0;
}
`,
  c: `/******************************************************************************
                              Co-Lab IDE C Sandbox
               Code, Compile, Run and Debug C program online.
Write your code in this editor and press "Run" button to compile and execute it.
*******************************************************************************/

#include <stdio.h>

int main()
{
    printf("Hello from Co-Lab IDE!\\n");
    return 0;
}
`,
  typescript: `// ==============================================================================
//                              Co-Lab IDE TypeScript Sandbox
// ==============================================================================

const greet = (name: string): string => {
    return \`Hello \${name} from Co-Lab IDE!\`;
};
console.log(greet("Developer"));
`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Co-Lab IDE!")
}
`,
  rust: `fn main() {
    println!("Hello from Co-Lab IDE!");
}
`,
  ruby: `puts "Hello from Co-Lab IDE!"
`,
  php: `<?php
echo "Hello from Co-Lab IDE!\\n";
?>
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Co-Lab Live Preview</title>
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e1b4b);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 2.5rem;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            transform: scale(0.9);
            animation: popIn 0.5s ease forwards;
        }
        h1 {
            background: linear-gradient(to right, #6366f1, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        p {
            color: #94a3b8;
        }
        @keyframes popIn {
            to { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Co-Lab Live Preview</h1>
        <p>Edit HTML, CSS, or JS in the editor to see instant live rendering updates!</p>
    </div>
</body>
</html>
`
};

const buildFileTree = (fileList: ISandboxFile[]) => {
  const root = { files: [] as any[], folders: {} as { [key: string]: any } };
  fileList.forEach((file, index) => {
    const parts = file.name.split('/');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.folders[part]) {
        current.folders[part] = { files: [], folders: {} };
      }
      current = current.folders[part];
    }
    current.files.push({ file, originalIndex: index });
  });
  return root;
};

interface FileTreeProps {
  node: any;
  depth?: number;
  activeFileIndex: number;
  handleSelectFile: (index: number) => void;
  handleDeleteFile: (fileName: string, e: React.MouseEvent) => void;
  files: ISandboxFile[];
  participants: Participant[];
  usernameMe?: string;
  isReadOnly: boolean;
}

const FileTree: React.FC<FileTreeProps> = ({
  node,
  depth = 0,
  activeFileIndex,
  handleSelectFile,
  handleDeleteFile,
  files,
  participants,
  usernameMe,
  isReadOnly
}) => {
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  return (
    <div className="space-y-1">
      {Object.keys(node.folders).map((folderName) => {
        const isExpanded = !!expandedFolders[folderName];
        return (
          <div key={folderName} className="select-none">
            <div 
              onClick={() => toggleFolder(folderName)}
              className="flex items-center space-x-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-xs font-semibold text-slate-400 transition"
              style={{ paddingLeft: `${(depth * 12) + 12}px` }}
            >
              <span>{isExpanded ? "📂" : "📁"}</span>
              <span className="truncate">{folderName}</span>
            </div>
            {isExpanded && (
              <FileTree 
                node={node.folders[folderName]} 
                depth={depth + 1} 
                activeFileIndex={activeFileIndex}
                handleSelectFile={handleSelectFile}
                handleDeleteFile={handleDeleteFile}
                files={files}
                participants={participants}
                usernameMe={usernameMe}
                isReadOnly={isReadOnly}
              />
            )}
          </div>
        );
      })}
      {node.files.map(({ file, originalIndex }: any) => {
        const isSelected = originalIndex === activeFileIndex;
        const remoteViewers = participants.filter(p => p.activeFile === file.name && p.username !== usernameMe);
        return (
          <div
            key={file.name}
            onClick={() => handleSelectFile(originalIndex)}
            className={`group flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition ${
              isSelected ? "bg-indigo-600 text-white" : "text-slate-355 hover:bg-slate-800 hover:text-white"
            }`}
            style={{ paddingLeft: `${(depth * 12) + 12}px` }}
          >
            <div className="flex items-center space-x-2 overflow-hidden truncate">
              <span>📄</span>
              <span className="truncate">{file.name.split('/').pop()}</span>
              {remoteViewers.length > 0 && (
                <span className="flex space-x-0.5 ml-1.5">
                  {remoteViewers.map((rv, rIdx) => (
                    <span 
                      key={rIdx} 
                      title={`${rv.username} is viewing this file`}
                      className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold"
                    >
                      {rv.username.charAt(0).toUpperCase()}
                    </span>
                  ))}
                </span>
              )}
            </div>
            {files.length > 1 && !isReadOnly && (
              <button 
                onClick={(e) => handleDeleteFile(file.name, e)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-[10px] p-0.5 transition"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CollaborativeSandBox: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [runTime, setRunTime] = useState<number>(0);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [room, setRoom] = useState<IRoom | undefined>(undefined);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isPendingApproval, setIsPendingApproval] = useState<boolean>(false);
  const [joinRequests, setJoinRequests] = useState<{ username: string; userId: string; socketId: string }[]>([]);
  
  // Stdin, Multi-file, Chat, Comments & Permissions states
  const [files, setFiles] = useState<ISandboxFile[]>([
    { name: "main.js", code: LANGUAGE_TEMPLATES.javascript, language: "javascript" }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<string>("16");
  
  const [stdinInput, setStdinInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"output" | "stdin" | "chat" | "comments">("output");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState<string>("");
  const [newFileName, setNewFileName] = useState<string>( "");
  const [showNewFileForm, setShowNewFileForm] = useState<boolean>(false);

  // Advanced collaborative states
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [comments, setComments] = useState<{ id: string; file: string; line: number; text: string; username: string; time: string }[]>([]);
  const [commentText, setCommentText] = useState<string>("");
  const [commentLine, setCommentLine] = useState<number>(1);

  const user = useAppSelector((state) => state.auth.user);
  const userId = user?._id || "";
  const { roomId } = useParams();
  const { getRoom, joinRoom } = useRoomService();
  const navigate = useNavigate();
  const axios = useAxios();

  const socketRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<{ [socketId: string]: string[] }>({});
  const styleTagsRef = useRef<{ [socketId: string]: HTMLStyleElement }>({});

  const activeFile = files[activeFileIndex] || files[0];

  useEffect(() => {
    // Sync local state code and language when active index changes
    if (activeFile) {
      setCode(activeFile.code);
      setLanguage(activeFile.language);
    }
  }, [activeFileIndex, files]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        notify("Login required to join", false);
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
        return;
      }
      try {
        const res = await getRoom(roomId || "");
        setRoom(res.room);
        
        // Load room sandbox files if allowed
        const userAllowed = res.isAllowed || res.room.author === user._id || (res.room.participants && res.room.participants.some((e: any) => e.id === user._id));
        
        if (userAllowed) {
          setIsAllowed(true);
          setIsPendingApproval(false);
          
          if (res.room.sandbox) {
            const filesData = res.room.sandbox.files || [];
            if (filesData.length > 0) {
              setFiles(filesData);
              setCode(filesData[0].code);
              setLanguage(filesData[0].language);
            } else {
              const defaultFiles = [{ name: "main.js", code: res.room.sandbox.code || LANGUAGE_TEMPLATES.javascript, language: res.room.sandbox.language || "javascript" }];
              setFiles(defaultFiles);
              setCode(res.room.sandbox.code || LANGUAGE_TEMPLATES.javascript);
              setLanguage(res.room.sandbox.language || "javascript");
            }
          }
        } else {
          setIsAllowed(false);
          setIsPendingApproval(true);
        }

        socketRef.current = await initSocket();
        if (!socketRef.current) return <Navigate to={"/"} />;

        socketRef.current.on("connect_error", (err: string) => { handleError(err); });
        socketRef.current.on("connect_failed", (err: string) => { handleError(err); });

        const sendJoinRequest = () => {
          socketRef.current.emit("request-join", {
            roomId,
            username: user.user_name,
            userId: user._id,
            socketId: socketRef.current.id
          });
        };

        if (userAllowed) {
          socketRef.current.emit(Actions.JOIN, {
            roomId,
            username: user?.user_name,
          });
        } else {
          if (socketRef.current.connected) {
            sendJoinRequest();
          } else {
            socketRef.current.on("connect", () => {
              sendJoinRequest();
            });
          }
        }

        // Listen for join approvals (requester side)
        socketRef.current.on("join-approved", async ({ password }: any) => {
          notify("Join request approved! Entering room...", true);
          try {
            const joinRes = await joinRoom({
              name: res.room.name,
              password,
              userId: user._id,
              userName: user.user_name
            });
            setRoom(joinRes.room);
            if (joinRes.room.sandbox) {
              const filesData = joinRes.room.sandbox.files || [];
              if (filesData.length > 0) {
                setFiles(filesData);
                setCode(filesData[0].code);
                setLanguage(filesData[0].language);
              }
            }
            setIsAllowed(true);
            setIsPendingApproval(false);
            
            socketRef.current.emit(Actions.JOIN, {
              roomId,
              username: user?.user_name,
            });
          } catch (err: any) {
            notify("Error joining room: " + err.message, false);
            navigate("/collab");
          }
        });

        // Listen for join rejections (requester side)
        socketRef.current.on("join-rejected", () => {
          notify("Access request denied by the host.", false);
          setIsPendingApproval(false);
          navigate("/collab");
        });

        // Listen for incoming join requests (host side)
        if (user?._id === res.room.author) {
          socketRef.current.on("join-request", ({ username, userId, socketId }: any) => {
            notify(`${username} requested to join the room!`, true);
            setJoinRequests(prev => {
              if (prev.some(r => r.socketId === socketId)) return prev;
              return [...prev, { username, userId, socketId }];
            });
          });
        }

        socketRef.current.on(
          Actions.JOINED,
          ({ clients, username }: { clients: Participant[]; username: string; socketId: string }) => {
            if (username !== user?.user_name) {
              notify(username + " Joined", true);
            }
            setParticipants(clients);
            // Sync files list to joining user
            if (socketRef.current) {
              socketRef.current.emit("file-select", { roomId, fileId: activeFile?.name });
            }
          }
        );

        socketRef.current.on(Actions.SYNC_CODE, ({ code: roomCode }: { code: string }) => {
          // If no files yet, sync code
          if (files.length <= 1 && files[0].code === "") {
            updateFileCode(files[0].name, roomCode);
          }
        });

        socketRef.current.on(
          Actions.DISCONNECTED,
          ({ socketId, username }: { socketId: string; username: string }) => {
            notify(`${username} Left`, false);
            setParticipants((prev) => prev.filter((e) => e.socketId !== socketId));
            
            // Clean up style widget tags
            if (styleTagsRef.current[socketId]) {
              styleTagsRef.current[socketId].remove();
              delete styleTagsRef.current[socketId];
            }
            // Clean up Monaco decorations
            if (editorRef.current && decorationsRef.current[socketId]) {
              editorRef.current.deltaDecorations(decorationsRef.current[socketId], []);
              delete decorationsRef.current[socketId];
            }
          }
        );

        // Remote Cursor Position / Figma Caret Listener
        socketRef.current.on("cursor-change", ({ socketId, user: remoteUser, position }: any) => {
          setParticipants((prev) =>
            prev.map((p) => (p.socketId === socketId ? { ...p, lineNumber: position.lineNumber } : p))
          );

          if (editorRef.current && monacoRef.current) {
            const oldDecs = decorationsRef.current[socketId] || [];
            
            // Inject dynamic CSS cursor and name badge class style
            let styleTag = styleTagsRef.current[socketId];
            if (!styleTag) {
              styleTag = document.createElement("style");
              styleTag.id = `cursor-style-${socketId}`;
              document.head.appendChild(styleTag);
              styleTagsRef.current[socketId] = styleTag;
            }

            const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];
            const userColor = colors[Math.abs(socketId.split("").reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0)) % colors.length];

            styleTag.innerHTML = `
              .remote-cursor-${socketId} {
                border-left: 2px solid ${userColor} !important;
                position: relative;
              }
              .remote-cursor-${socketId}::after {
                content: '${remoteUser?.user_name || "Coder"}';
                position: absolute;
                top: -16px;
                left: 0;
                background: ${userColor};
                color: white;
                font-size: 8px;
                font-weight: bold;
                padding: 1px 3px;
                border-radius: 3px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 100;
                opacity: 0.9;
              }
            `;

            const range = new monacoRef.current.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            );

            const cursorDec = {
              range,
              options: {
                className: `remote-cursor-${socketId}`,
                hoverMessage: { value: `${remoteUser?.user_name || "Someone"} is typing here` }
              }
            };

            const lineDec = {
              range: new monacoRef.current.Range(position.lineNumber, 1, position.lineNumber, 1),
              options: {
                isWholeLine: true,
                className: "remote-active-line"
              }
            };

            const newDecIds = editorRef.current.deltaDecorations(oldDecs, [cursorDec, lineDec]);
            decorationsRef.current[socketId] = newDecIds;
          }
        });

        // Remote code change listener (specific file)
        socketRef.current.on(Actions.CODE_CHANGED, ({ code: remoteCode, fileId }: any) => {
          updateFileCode(fileId, remoteCode);
        });

        // Remote file events
        socketRef.current.on("file-create", ({ file }: any) => {
          setFiles(prev => {
            if (prev.find(f => f.name === file.name)) return prev;
            return [...prev, file];
          });
        });

        socketRef.current.on("file-delete", ({ fileId }: any) => {
          setFiles(prev => prev.filter(f => f.name !== fileId));
          setActiveFileIndex(0);
        });

        socketRef.current.on("file-select", ({ fileId, socketId }: any) => {
          setParticipants(prev =>
            prev.map(p => (p.socketId === socketId ? { ...p, activeFile: fileId } : p))
          );
        });

        // Remote Chat Listener
        socketRef.current.on("chat-message", ({ message }: any) => {
          setChatMessages(prev => [...prev, message]);
        });

        // Remote Permission Toggled Listener
        socketRef.current.on("permission-toggled", ({ isReadOnly }: any) => {
          setIsReadOnly(isReadOnly);
          if (isReadOnly) {
            notify("The host has set your access to read-only.", false);
          } else {
            notify("The host has restored your write access.", true);
          }
        });

        // Remote Comment Received Listener
        socketRef.current.on("comment-received", ({ comment }: any) => {
          setComments(prev => [...prev, comment]);
        });
      } catch (error: any) {
        notify(error.message, false);
        setTimeout(() => { navigate("/signin"); }, 1000);
      }

      const handleError = (err: string) => {
        console.log(err);
        return <ErrorBoundary />;
      };
    };

    init();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(Actions.JOINED);
        socketRef.current.off(Actions.DISCONNECTED);
        socketRef.current.off("cursor-change");
        socketRef.current.off(Actions.CODE_CHANGED);
        socketRef.current.off("file-create");
        socketRef.current.off("file-delete");
        socketRef.current.off("file-select");
        socketRef.current.off("chat-message");
        socketRef.current.off("join-request");
        socketRef.current.off("join-approved");
        socketRef.current.off("join-rejected");
        socketRef.current.off("permission-toggled");
        socketRef.current.off("comment-received");
      }
      // Clean styles
      Object.values(styleTagsRef.current).forEach(tag => tag.remove());
    };
  }, []);

  const handleTogglePermission = (socketId: string, currentReadOnly: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit("toggle-permission", { targetSocketId: socketId, isReadOnly: !currentReadOnly });
      setParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, isReadOnly: !currentReadOnly } : p));
      notify(currentReadOnly ? "Restored write permissions" : "Locked permissions to read-only", true);
    }
  };

  const handleJumpToCollaborator = (socketId: string) => {
    const participant = participants.find(p => p.socketId === socketId);
    if (participant && participant.lineNumber && editorRef.current) {
      editorRef.current.revealLineInCenter(participant.lineNumber);
      editorRef.current.setPosition({ lineNumber: participant.lineNumber, column: 1 });
      editorRef.current.focus();
      notify(`Jumped to ${participant.username}'s cursor`, true);
    } else {
      notify("Collaborator is not active on any line yet", false);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || commentText.trim() === "") return;
    if (!activeFile) return;

    const newComment = {
      id: Math.random().toString(36).substring(7),
      file: activeFile.name,
      line: commentLine,
      text: commentText.trim(),
      username: user?.user_name || "Coder",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setComments(prev => [...prev, newComment]);
    if (socketRef.current) {
      socketRef.current.emit("new-comment", { roomId, comment: newComment });
    }
    setCommentText("");
    notify("Comment added!", true);
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        const name = file.name;
        if (files.find(f => f.name === name)) {
          notify(`File ${name} already exists!`, false);
          return;
        }

        let lang = "javascript";
        if (name.endsWith(".py")) lang = "python";
        else if (name.endsWith(".java")) lang = "java";
        else if (name.endsWith(".cpp")) lang = "cpp";
        else if (name.endsWith(".c")) lang = "c";

        const newFile: ISandboxFile = { name, code: fileContent, language: lang };
        setFiles(prev => [...prev, newFile]);
        if (socketRef.current) {
          socketRef.current.emit("file-create", { roomId, file: newFile });
        }
        notify(`Imported file ${name}`, true);
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadZIP = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.code);
    });
    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${room?.name || "project"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      notify("ZIP download started!", true);
    } catch (err: any) {
      notify("Failed to generate ZIP: " + err.message, false);
    }
  };

  const handleApproveJoin = (requesterSocketId: string, name: string) => {
    if (socketRef.current && room) {
      socketRef.current.emit("approve-join", {
        requesterSocketId,
        roomId: room._id,
        password: room.password
      });
      notify(`Approved ${name}'s request`, true);
      setJoinRequests(prev => prev.filter(r => r.socketId !== requesterSocketId));
    }
  };

  const handleRejectJoin = (requesterSocketId: string, name: string) => {
    if (socketRef.current) {
      socketRef.current.emit("reject-join", { requesterSocketId });
      notify(`Rejected ${name}'s request`, false);
      setJoinRequests(prev => prev.filter(r => r.socketId !== requesterSocketId));
    }
  };

  const updateFileCode = (fileName: string, newCode: string) => {
    setFiles(prev => prev.map(f => f.name === fileName ? { ...f, code: newCode } : f));
  };

  const handleCodeChange = (newCode: any, position: any) => {
    if (!activeFile) return;
    updateFileCode(activeFile.name, newCode);
    socketRef.current.emit(Actions.CODE_CHANGED, {
      roomId,
      fileId: activeFile.name,
      code: newCode,
      user,
      position
    });
  };

  const handleLanguageChange = (newLang: any) => {
    const val = typeof newLang === 'function' ? newLang(language) : newLang;
    setLanguage(val);

    if (activeFile) {
      const currentCode = activeFile.code;
      const isTemplateOrEmpty = 
        currentCode.trim() === "" || 
        currentCode.trim() === "// Welcome to Co-Lab IDE" ||
        Object.values(LANGUAGE_TEMPLATES).some(tpl => tpl.trim() === currentCode.trim());

      const newCode = isTemplateOrEmpty ? (LANGUAGE_TEMPLATES[val] || "") : activeFile.code;

      setFiles(prev => prev.map((f, idx) => 
        idx === activeFileIndex ? { ...f, language: val, code: newCode } : f
      ));

      setCode(newCode);

      socketRef.current.emit(Actions.CODE_CHANGED, {
        roomId,
        fileId: activeFile.name,
        code: newCode,
        user,
        position: editorRef.current ? editorRef.current.getPosition() : { lineNumber: 1, column: 1 }
      });
    }
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || newFileName.trim() === "") return;
    const name = newFileName.trim();
    if (files.find(f => f.name === name)) {
      notify("File already exists!", false);
      return;
    }

    // Infer language from extension
    let lang = "javascript";
    if (name.endsWith(".py")) lang = "python";
    else if (name.endsWith(".java")) lang = "java";
    else if (name.endsWith(".cpp")) lang = "cpp";
    else if (name.endsWith(".c")) lang = "c";

    const defaultCode = LANGUAGE_TEMPLATES[lang] || "";
    const newFile: ISandboxFile = { name, code: defaultCode, language: lang };
    setFiles(prev => [...prev, newFile]);
    setShowNewFileForm(false);
    setNewFileName("");

    socketRef.current.emit("file-create", { roomId, file: newFile });
  };

  const handleDeleteFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      notify("Workspace requires at least one file", false);
      return;
    }
    setFiles(prev => prev.filter(f => f.name !== fileName));
    setActiveFileIndex(0);
    socketRef.current.emit("file-delete", { roomId, fileId: fileName });
  };

  const handleSelectFile = (index: number) => {
    setActiveFileIndex(index);
    const fileName = files[index]?.name;
    if (socketRef.current) {
      socketRef.current.emit("file-select", { roomId, fileId: fileName });
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText || chatText.trim() === "") return;
    
    const message: ChatMessage = {
      text: chatText.trim(),
      username: user?.user_name || "Coder",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      socketId: socketRef.current.id
    };

    setChatMessages(prev => [...prev, message]);
    socketRef.current.emit("chat-message", { roomId, message });
    setChatText("");
  };

  const runCode = async () => {
    if (!activeFile) return;
    try {
      if (code.length === 0) {
        notify("Empty code", false);
        return;
      }
      setRunning(true);
      const response = await axios.post("code/execute", {
        code,
        language,
        userId,
        input: stdinInput // Pass stdin input parameter
      });
      const jobId = response.data.jobId;

      const intervalId = setInterval(async () => {
        const { data } = await axios.get("code/status", { params: { jobId } });
        if (data.success) {
          const { output: runOutput, startedAt, completedAt, status } = data.data.job;
          if (status === "pending") return;
          
          clearInterval(intervalId);
          setOutput(runOutput);
          const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
          setRunTime(duration);
          setRunning(false);
          setActiveTab("output"); // Switch to output tab
        } else {
          clearInterval(intervalId);
          setOutput(data.data.job.output);
          setRunning(false);
          setActiveTab("output");
        }
      }, 1000);
    } catch (error: any) {
      setRunning(false);
      notify(error.response?.data || error.message, false);
    }
  };

  if (isPendingApproval) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-3xl animate-pulse text-indigo-400">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Awaiting Admission</h1>
            <p className="text-sm text-slate-400">This collaboration room is password-protected. We have sent a request to the room host to let you in.</p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-850 px-4 py-3.5 rounded-xl w-full justify-center">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-350 font-medium">Waiting for host approval...</span>
          </div>

          <button
            onClick={() => navigate("/collab")}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return <ErrorBoundary />;
  }

  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: Number(fontSize),
    minimap: { enabled: false },
    readOnly: isReadOnly
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-white font-sans">
      {/* Floating Join Requests Queue for Host */}
      {joinRequests.length > 0 && (
        <div className="fixed top-20 right-5 z-50 flex flex-col space-y-3 pointer-events-auto">
          {joinRequests.map((req) => (
            <div 
              key={req.socketId} 
              className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-4 w-80 animate-in slide-in-from-right-10 duration-300 border-l-4 border-l-indigo-500"
            >
              <div className="flex flex-col space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400">👋</span>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Admission Request</h4>
                    <p className="text-xs text-slate-300 mt-1 truncate">
                      User <span className="text-white font-semibold">{req.username}</span> wants to join.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => handleApproveJoin(req.socketId, req.username)}
                    className="flex-grow bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg transition duration-200 shadow-md shadow-indigo-600/15"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectJoin(req.socketId, req.username)}
                    className="flex-grow bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-semibold py-2 rounded-lg border border-slate-700/80 transition duration-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && participants ? (
        <RoomDetailsModal
          roomName={room?.name || ""}
          roomPassword={room?.password || ""}
          setShowModal={setShowModal}
          participants={participants}
          isHost={user?._id === room?.author}
          onTogglePermission={handleTogglePermission}
          mySocketId={socketRef.current?.id}
        />
      ) : (
        <></>
      )}
      <Toaster />
      <SandBoxNav
        runCode={runCode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        code={code}
        theme={theme}
        setTheme={setTheme}
        running={running}
        setCode={setCode}
        language={language}
        setLanguage={handleLanguageChange}
        room={room}
        participants={participants}
        setShowModal={setShowModal}
        onJumpToCollaborator={handleJumpToCollaborator}
        isReadOnly={isReadOnly}
      />

      <div className="flex flex-1 overflow-hidden bg-slate-950">
        
        {/* Left Workspace File tree sidebar */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropFiles}
          className="w-[220px] bg-slate-900 border-r border-slate-800 flex flex-col select-none"
        >
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Files</span>
            {!isReadOnly && (
              <button 
                onClick={() => setShowNewFileForm(!showNewFileForm)} 
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded font-semibold transition"
              >
                + Add
              </button>
            )}
          </div>

          {showNewFileForm && !isReadOnly && (
            <form onSubmit={handleCreateFile} className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
              <input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="src/utils/math.py"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <div className="flex space-x-2">
                <button type="submit" className="text-[10px] bg-green-600 px-2 py-1 rounded text-white font-bold flex-1">Create</button>
                <button type="button" onClick={() => setShowNewFileForm(false)} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 flex-1">Cancel</button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <FileTree
              node={buildFileTree(files)}
              activeFileIndex={activeFileIndex}
              handleSelectFile={handleSelectFile}
              handleDeleteFile={handleDeleteFile}
              files={files}
              participants={participants}
              usernameMe={user?.user_name}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex flex-col space-y-2">
            <button
              onClick={handleDownloadZIP}
              className="w-full bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-semibold py-2 rounded-lg transition duration-200 border border-slate-700 hover:border-indigo-500 flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <span>📦 Download ZIP</span>
            </button>
          </div>
        </div>

        {/* Center Code Editor */}
        <div className="flex-1 h-full border-r border-slate-800 relative">
          <MonacoEditor
            onChange={(newVal) => {
              handleCodeChange(newVal, editorRef.current.getPosition());
            }}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              editor.onDidChangeCursorPosition((e: any) => {
                if (socketRef.current) {
                  socketRef.current.emit("cursor-change", {
                    roomId,
                    user,
                    position: e.position
                  });
                }
              });
            }}
            value={code}
            height="100%"
            options={editorOptions}
            language={language}
            theme={theme}
          />
        </div>

        {/* Right Console, Stdin & Chat panel drawer */}
        <div className="w-[320px] bg-slate-900 flex flex-col select-none border-l border-slate-800">
          
          {/* Tab Selection */}
          <div className="flex border-b border-slate-800 text-[10px] md:text-xs font-bold bg-slate-900">
            <button
              onClick={() => setActiveTab("output")}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                activeTab === "output" ? "border-indigo-500 text-white bg-slate-850" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Console
            </button>
            <button
              onClick={() => setActiveTab("stdin")}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                activeTab === "stdin" ? "border-indigo-500 text-white bg-slate-850" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Input
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-center border-b-2 transition relative ${
                activeTab === "chat" ? "border-indigo-500 text-white bg-slate-850" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`flex-1 py-3 text-center border-b-2 transition relative ${
                activeTab === "comments" ? "border-indigo-500 text-white bg-slate-850" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Review
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
            {activeTab === "output" && (
              <div className="flex-grow flex flex-col h-full overflow-hidden">
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto text-emerald-400 leading-relaxed h-full">
                  {language.toLowerCase() === "html" ? (
                    <iframe
                      srcDoc={code}
                      title="HTML Live Preview"
                      sandbox="allow-scripts"
                      className="w-full h-full bg-white rounded-xl border border-slate-800"
                    />
                  ) : output ? (
                    <pre className="whitespace-pre-wrap font-mono break-all">{output}</pre>
                  ) : (
                    <span className="text-slate-600 italic">Run your code to see the output logs here...</span>
                  )}
                </div>
                <div className="bg-slate-900/60 px-4 py-3 border-t border-slate-850 text-xs text-slate-500 flex justify-between items-center font-medium">
                  <span>Status: <span className={running ? "text-amber-400 font-semibold" : "text-emerald-500 font-semibold"}>{running ? "Running..." : "Idle"}</span></span>
                  <span>Execution Time: <span className="text-slate-300">{runTime} ms</span></span>
                </div>
              </div>
            )}

            {activeTab === "stdin" && (
              <div className="flex-1 p-4 flex flex-col space-y-2 h-full">
                <p className="text-xs text-slate-400">Provide input parameters to be passed to your console application during runtime (e.g. read via standard inputs).</p>
                <textarea
                  value={stdinInput}
                  onChange={(e) => setStdinInput(e.target.value)}
                  placeholder="Enter inputs here (one per line)..."
                  className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
                />
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex-grow flex flex-col h-full overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-slate-600 italic text-center pt-10">No messages in room chat yet. Say hello!</p>
                  ) : (
                    chatMessages.map((msg, index) => {
                      const isMe = msg.username === user?.user_name;
                      return (
                        <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <span className="text-[10px] text-slate-500 mb-1 font-semibold">{msg.username} • {msg.time}</span>
                          <span className={`px-3 py-2 rounded-xl text-xs max-w-[85%] break-all ${
                            isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                          }`}>
                            {msg.text}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={sendChatMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex space-x-2">
                  <input
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 rounded-xl text-xs transition">Send</button>
                </form>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="flex-grow flex flex-col h-full overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-600 italic text-center pt-10">No code comments yet. Add one below!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                          <span>{comment.username} • {comment.time}</span>
                          <span className="bg-indigo-600/35 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">
                            {comment.file.split('/').pop()} : Line {comment.line}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleAddComment} className="p-3 bg-slate-900 border-t border-slate-800 space-y-2.5 flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Number:</span>
                    <input
                      type="number"
                      min={1}
                      value={commentLine}
                      onChange={(e) => setCommentLine(Math.max(1, Number(e.target.value)))}
                      className="w-16 bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-white focus:outline-none text-center"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Comment on this line..."
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 rounded-xl text-xs transition">Add</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollaborativeSandBox;
