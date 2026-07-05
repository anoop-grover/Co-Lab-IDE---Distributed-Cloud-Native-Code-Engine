import React, { useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Toaster } from "react-hot-toast";
import { notify } from "../utils/notify";
import { useAppSelector } from "../app/hooks";
import SandBoxNav from "../components/SandBoxNav";
import { useParams } from "react-router-dom";
import useAxios from '../hooks/useAxios';
import JSZip from "jszip";

interface ISandboxFile {
  name: string;
  code: string;
  language: string;
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
}

const FileTree: React.FC<FileTreeProps> = ({
  node,
  depth = 0,
  activeFileIndex,
  handleSelectFile,
  handleDeleteFile,
  files
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
              />
            )}
          </div>
        );
      })}
      {node.files.map(({ file, originalIndex }: any) => {
        const isSelected = originalIndex === activeFileIndex;
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
            </div>
            {files.length > 1 && (
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

const SandBox: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [runTime, setRunTime] = useState<number>(0);
  
  // Stdin & Multi-file states
  const [files, setFiles] = useState<ISandboxFile[]>([
    { name: "main.js", code: LANGUAGE_TEMPLATES.javascript, language: "javascript" }
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

  const userId = useAppSelector((state) => {
    return state.auth.user?._id;
  });

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

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
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
      link.download = `project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      notify("ZIP download started!", true);
    } catch (err: any) {
      notify("Failed to generate ZIP: " + err.message, false);
    }
  };

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
          const defaultFiles = [{ name: "main.js", code: sandboxData.code || LANGUAGE_TEMPLATES.javascript, language: sandboxData.language || "javascript" }];
          setFiles(defaultFiles);
          setCode(sandboxData.code || LANGUAGE_TEMPLATES.javascript);
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
        return;
      }
      setRunning(true);
      const response = await axios.post(
        "code/execute",
        { code, language, userId, input: stdinInput }
      );
      const jobId = response.data.jobId;

      const intervalId = setInterval(async () => {
        const { data } = await axios.get(
          "code/status",
          { params: { jobId } }
        );
        if (data.success) {
          const { output: runOutput, startedAt, completedAt, status } = data.data.job;
          if (status === "pending") return;
          
          clearInterval(intervalId);
          setOutput(runOutput);
          const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
          setRunTime(duration);
          setRunning(false);
          setActiveTab("output"); // Auto switch to output
        } else {
          clearInterval(intervalId);
          setOutput(data.data.job.output);
          setRunning(false);
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
      />

      <div className="flex flex-1 overflow-hidden bg-slate-950">
        
        {/* Left Files Sidebar */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropFiles}
          className="w-[220px] bg-slate-900 border-r border-slate-800 flex flex-col select-none"
        >
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
              handleSelectFile={setActiveFileIndex}
              handleDeleteFile={handleDeleteFile}
              files={files}
            />
          </div>
          
          {/* Custom Save File Button */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex flex-col space-y-2">
            <button 
              onClick={handleSave}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-600/10"
            >
              Save Project
            </button>
            <button
              onClick={handleDownloadZIP}
              className="w-full py-2 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-semibold rounded-lg transition duration-200 border border-slate-700 hover:border-indigo-500 flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <span>📦 Download ZIP</span>
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
  );
};

export default SandBox;
