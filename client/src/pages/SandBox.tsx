import React, { useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Toaster } from "react-hot-toast";
import { notify } from "../utils/notify";
import { useAppSelector } from "../app/hooks";
import SandBoxNav from "../components/SandBoxNav";
<<<<<<< HEAD
import { useParams } from "react-router-dom";
import useAxios from '../hooks/useAxios';

interface ISandboxFile {
  name: string;
  code: string;
  language: string;
}

const SandBox: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [runTime, setRunTime] = useState<number>(0);
  
  // Stdin & Multi-file states
  const [files, setFiles] = useState<ISandboxFile[]>([
    { name: "main.js", code: "", language: "javascript" }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<string>("16");

  const [stdinInput, setStdinInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"output" | "stdin">("output");
  const [newFileName, setNewFileName] = useState<string>( "");
  const [showNewFileForm, setShowNewFileForm] = useState<boolean>(false);

  const { fileId } = useParams();
  const axios = useAxios();
=======
import {  useParams } from "react-router-dom";
import useAxios from '../hooks/useAxios'
const SandBox: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<string>("10");
  const [running, setRunning] = useState<boolean>(false);
  const [runTime, setRunTime] = useState<number>(0);
  const {fileId} = useParams();
  useEffect(() => {
    fetchData();
  }, [])
  const axios = useAxios();
  const fetchData = async ()=>{
      try {
          const response = await axios.get(`code/file/${fileId}`);
          setCode(response.data.data.sandBox.code);
      } catch (error:any) {
        notify(error.response.data.message,false);
        console.log(error)
      }
  }  
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac

  const userId = useAppSelector((state) => {
    return state.auth.user?._id;
  });

<<<<<<< HEAD
  const activeFile = files[activeFileIndex] || files[0];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.code);
      setLanguage(activeFile.language);
    }
  }, [activeFileIndex, files]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`code/file/${fileId}`);
      const sandboxData = response.data.data.sandBox;
      if (sandboxData) {
        const filesData = sandboxData.files || [];
        if (filesData.length > 0) {
          setFiles(filesData);
          setCode(filesData[0].code);
          setLanguage(filesData[0].language);
        } else {
          const defaultFiles = [{ name: "main.js", code: sandboxData.code || "", language: sandboxData.language || "javascript" }];
          setFiles(defaultFiles);
          setCode(sandboxData.code || "");
          setLanguage(sandboxData.language || "javascript");
        }
      }
    } catch (error: any) {
      notify(error.response?.data?.message || error.message, false);
      console.log(error);
    }
  };

  const updateFileCode = (fileName: string, newCode: string) => {
    setFiles(prev => prev.map(f => f.name === fileName ? { ...f, code: newCode } : f));
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || newFileName.trim() === "") return;
    const name = newFileName.trim();
    if (files.find(f => f.name === name)) {
      notify("File already exists!", false);
      return;
    }

    let lang = "javascript";
    if (name.endsWith(".py")) lang = "python";
    else if (name.endsWith(".java")) lang = "java";
    else if (name.endsWith(".cpp")) lang = "cpp";
    else if (name.endsWith(".c")) lang = "c";

    const newFile: ISandboxFile = { name, code: "", language: lang };
    setFiles(prev => [...prev, newFile]);
    setShowNewFileForm(false);
    setNewFileName("");
  };

  const handleDeleteFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      notify("Workspace requires at least one file", false);
      return;
    }
    setFiles(prev => prev.filter(f => f.name !== fileName));
    setActiveFileIndex(0);
  };

  const runCode = async () => {
    try {
      if (code.length === 0) {
        notify("Empty code", false);
=======
  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: Number(fontSize),
  };
  const runCode = async () => {
    try {
      if(code.length===0){
        notify("Empty code",false);
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
        return;
      }
      setRunning(true);
      const response = await axios.post(
        "code/execute",
<<<<<<< HEAD
        { code, language, userId, input: stdinInput }
=======
        { code, language, userId }
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
      );
      const jobId = response.data.jobId;

      const intervalId = setInterval(async () => {
        const { data } = await axios.get(
          "code/status",
          { params: { jobId } }
        );
        if (data.success) {
<<<<<<< HEAD
          const { output: runOutput, startedAt, completedAt, status } = data.data.job;
          if (status === "pending") return;
          
          clearInterval(intervalId);
          setOutput(runOutput);
          const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
          setRunTime(duration);
          setRunning(false);
          setActiveTab("output"); // Auto switch to output
=======
          const { output, startedAt, completedAt, status } = data.data.job;
          if (status == "pending") {
            return;
          }
          clearInterval(intervalId);
          setOutput(output);
          const startedAt1: Date = new Date(startedAt);
          const completedAt1: Date = new Date(completedAt);
          const durationInMilliseconds: number = completedAt1.getTime() - startedAt1.getTime();
          setRunTime(durationInMilliseconds);
          setRunning(false);
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
        } else {
          clearInterval(intervalId);
          setOutput(data.data.job.output);
          setRunning(false);
<<<<<<< HEAD
          setActiveTab("output");
        }
      }, 1000);
    } catch (error: any) {
      console.log(error);
      setRunning(false);
      notify(error.response?.data || error.message, false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.patch(`code/save/${fileId}`, {
        code,
        language,
        files // Save the entire files list
      });
      notify("saved!", true);
    } catch (error: any) {
      notify(error.message, false);
    }
  };

  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: Number(fontSize),
    minimap: { enabled: false }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-white font-sans">
=======
        }
      }, 1000);
    } catch (error: any) {
     console.log(error)
      setRunning(false);
      // return
      // if (error.response) {
      //   notify(error.response.data, false);
      //   return;
      // }
      notify(error.response.data || error.message, false);
      console.error("Error running code:", error);
      return;
    }
  };
  return (
    <>
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
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
        setLanguage={setLanguage}
      />

<<<<<<< HEAD
      <div className="flex flex-1 overflow-hidden bg-slate-950">
        
        {/* Left Files Sidebar */}
        <div className="w-[220px] bg-slate-900 border-r border-slate-800 flex flex-col select-none">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Files</span>
            <button 
              onClick={() => setShowNewFileForm(!showNewFileForm)} 
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded font-semibold transition"
            >
              + Add
            </button>
          </div>

          {showNewFileForm && (
            <form onSubmit={handleCreateFile} className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
              <input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.py"
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
            {files.map((file, idx) => {
              const isSelected = idx === activeFileIndex;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition ${
                    isSelected ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden truncate">
                    <span className="text-xs">📄</span>
                    <span className="truncate">{file.name}</span>
                  </div>
                  {files.length > 1 && (
                    <button 
                      onClick={(e) => handleDeleteFile(file.name, e)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Custom Save File Button */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/60">
            <button 
              onClick={handleSave}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-600/10"
            >
              Save Project
            </button>
          </div>
        </div>

        {/* Center Monaco Editor */}
        <div className="flex-1 h-full border-r border-slate-800 relative">
          <MonacoEditor
            onChange={(newVal) => {
              if (activeFile) updateFileCode(activeFile.name, newVal || "");
            }}
            value={code}
            height="100%"
            options={editorOptions}
            language={language}
            theme={theme}
          />
        </div>

        {/* Right Output & Input panel */}
        <div className="w-[320px] bg-slate-900 flex flex-col select-none border-l border-slate-800">
          
          <div className="flex border-b border-slate-800 text-xs font-bold bg-slate-900">
            <button
              onClick={() => setActiveTab("output")}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                activeTab === "output" ? "border-indigo-500 text-white bg-slate-850" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Console Output
            </button>
            <button
              onClick={() => setActiveTab("stdin")}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                activeTab === "stdin" ? "border-indigo-500 text-white bg-slate-850" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Input (stdin)
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
            {activeTab === "output" && (
              <div className="flex-grow flex flex-col h-full overflow-hidden">
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto text-emerald-400 leading-relaxed">
                  {output ? (
                    <pre className="whitespace-pre-wrap font-mono break-all">{output}</pre>
                  ) : (
                    <span className="text-slate-600 italic">Run your code to see the output logs here...</span>
                  )}
                </div>
                <div className="bg-slate-900/60 px-4 py-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center font-medium">
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
                  className="flex-grow w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
=======
      <div className="flex">
        <MonacoEditor
        value={code}
          height="100vh"
          width="70vw"
          options={editorOptions}
          language={language}
          theme={theme}
          onChange={(val) => {
            setCode(val || "");
          }}
        />

        <div className="bg-black text-green-400 w-[40%]">
          <h2>Output:</h2>
          <pre className="text-green-400">{output}</pre>
          <h4>Completed in {runTime} ms</h4>
        </div>
      </div>
    </>
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
  );
};

export default SandBox;
