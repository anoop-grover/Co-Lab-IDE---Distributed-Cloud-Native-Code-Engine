import { useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { notify } from '../utils/notify';
import { Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import useCodeService from '../hooks/useCode';
import { SparklesCore } from '../components/ui/sparkles';

const CreateFile = () => {
  const [title, setTitle] = useState<string>("");
  const { createFile } = useCodeService();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationKey: ["createfile"],
    mutationFn: createFile,
    onSuccess: (data) => {
      navigate(`/sandbox/${user?._id}/${data.sandBox._id}`);
    },
    onError: (data: any) => {
      notify(data.message || "Failed to create file", false);
    }
  });

  const handleCreateFile = async (e: any) => {
    e.preventDefault();
    try {
      if (!token) {
        notify("Not allowed", false);
        return;
      }
      if (title.length < 3) {
        notify("Title is too short", false);
        return;
      }
      mutate({ title });
    } catch (error: any) {
      notify(error.message, false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
      <div className="w-full absolute inset-0 h-full">
        <SparklesCore
          id="tsparticlescreatefile"
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

      <div className="relative z-10 w-full max-w-3xl mx-4 p-1 bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 rounded-2xl shadow-2xl">
        <div className="flex flex-col md:flex-row bg-slate-900/90 backdrop-blur-lg rounded-2xl overflow-hidden">
          
          {/* Form Side */}
          <form
            className="w-full md:w-3/5 p-8 sm:p-12 flex flex-col justify-center space-y-6"
            onSubmit={handleCreateFile}
          >
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Workspace</h1>
              <p className="text-sm text-slate-400 mt-2">Open a personal coding sandbox to write and run scripts.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sandbox File Title
              </label>
              <input
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                type="text"
                placeholder="e.g. MyScript"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                required
              />
            </div>

            <div className="flex flex-col space-y-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-600/10"
              >
                {isPending ? "Creating Workspace..." : "Create Workspace"}
              </button>
              
              <Link
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-sm border border-slate-700 transition-all duration-200 text-center"
                to="/"
              >
                Back to Dashboard
              </Link>
            </div>
          </form>

          {/* Image Side */}
          <div className="hidden md:flex w-2/5 bg-slate-950 items-center justify-center p-8 border-l border-slate-800">
            <img 
              src="https://emeritus.org/in/wp-content/uploads/sites/3/2023/02/pexels-neo-2653362-scaled-e1677062152304.jpg.optimal.jpg" 
              alt="Programming Workspace" 
              className="object-cover w-full h-72 rounded-xl opacity-80" 
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateFile;
