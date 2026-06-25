import { Link } from "react-router-dom"
<<<<<<< HEAD
import { SparklesCore } from "../components/ui/sparkles"

const Hello = () => {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col w-full bg-slate-950 relative items-center justify-center overflow-hidden">
      
      {/* Background Sparkles Effect */}
      <div className="w-full absolute inset-0 h-full">
        <SparklesCore
          id="tsparticleshello"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={40}
          className="w-full h-full"
          particleColor="#6366F1"
        />
      </div>

      {/* Radial Gradient overlay for depth */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-slate-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6 tracking-wide animate-pulse">
          ⚡ COLLABORATION MODE ACTIVE
        </span>
        
        <h1 className="text-5xl sm:text-8xl font-extrabold tracking-tight text-white mb-6">
          Write & Execute Code{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Together
          </span>
        </h1>

        <p className="text-md sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-light">
          A high-performance, distributed, real-time collaborative workspace supporting multi-language compilation, live cursor syncing, and isolated sandbox containers.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            to="/signin"
            className="w-48 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-indigo-600/35 flex items-center justify-center group"
          >
            Launch Workspace
            <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
          <Link
            to="/signup"
            className="w-48 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold text-sm transition-all duration-300 flex items-center justify-center"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
=======

const Hello = () => {
  return (
    <div className="h-[50rem] flex flex-col w-full dark:bg-black bg-white  dark:bg-dot-white/[0.2] bg-dot-black/[0.2] relative  items-center justify-center">
    <div className="absolute  pointer-events-none inset-0 flex flex-col  items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
    <p className="text-4xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 py-8">
      Hello Coder!
     
    </p>
    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4 mt-10">
        <Link to={"/signin"} className="w-40 flex items-center justify-center h-10 rounded-xl bg-black border dark:border-white border-transparent text-white text-sm">
          Login
        </Link>
        <Link to={"/signup"} className="w-40 h-10 flex items-center justify-center rounded-xl bg-white text-black border border-black  text-sm">
          Signup
        </Link>
      </div>
  </div>

>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
  )
}

export default Hello