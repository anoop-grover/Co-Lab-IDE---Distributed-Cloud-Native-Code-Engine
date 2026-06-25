import { Link } from "react-router-dom";
import "../index.css";
import { ChangeEvent, useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { login } from "../app/slices/authSlice";
import { Toaster } from "react-hot-toast";
import { notify } from "../utils/notify";
import { useMutation } from "@tanstack/react-query";
<<<<<<< HEAD
import useAuthService from "../hooks/useAuth";
import { validEmail } from "../utils/validEmail";
import { SparklesCore } from "../components/ui/sparkles";
=======

import useAuthService from "../hooks/useAuth";
import { validEmail } from "../utils/validEmail";
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac

const SignUp = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [cpassword, setCPassword] = useState<string>("");
  const [user_name, setUser_name] = useState<string>("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [user_nameError, setUser_nameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [cpasswordError, setCPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { registerUser } = useAuthService();
  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: registerUser,
    onSuccess: (data) => {
      dispatch(login(data));
      notify("Login Successful", true);
    },
<<<<<<< HEAD
    onError: (data: any) => {
      notify(data.message || "Registration failed", false);
      setLoading(false);
    },
  });

=======
    onError: (data) => {
      notify(data.message, false);
      setLoading(false);
    },
  });
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
  function handleEmailChange(e: ChangeEvent<HTMLInputElement>): void {
    !validEmail(e.target.value) ? setEmailError("Invalid Email Id") : setEmailError(null);
    setEmail(e.target.value);
  }

  function handleUserNameChange(e: ChangeEvent<HTMLInputElement>): void {
    const val = e.target.value;
    if (val.length < 3) setUser_nameError("Minimum 3 characters required");
    else if (val.length > 20)
      setUser_nameError("Maximum 20 characters allowed");
    else setUser_nameError(null);
    setUser_name(e.target.value);
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>): void {
    const val = e.target.value;
    if (val.length < 6) setPasswordError("Minimum 6 characters required");
    else if (val.length > 20) setPasswordError("Maximum 20 characters allowed");
    else setPasswordError(null);
    setPassword(val);
  }

  function handleCPasswordChange(e: ChangeEvent<HTMLInputElement>): void {
    setCPassword(e.target.value);
    e.target.value != password
      ? setCPasswordError("Passwords don't match")
      : setCPasswordError(null);
  }
<<<<<<< HEAD

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (emailError || user_nameError || passwordError || cpasswordError) {
      notify("Please correct form errors", false);
      return;
    }
=======
  const handleSubmit = (e: any) => {
    e.preventDefault();
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
    setLoading(true);
    mutate({ email, password, user_name });
  };

  return (
<<<<<<< HEAD
    <div className="h-[calc(100vh-64px)] w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
      
      {/* Background Sparkles Effect */}
      <div className="w-full absolute inset-0 h-full">
        <SparklesCore
          id="tsparticlessignup"
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

      <div className="relative z-10 w-full max-w-md mx-4 p-8 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-y-auto max-h-[90%] scrollbar-thin">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
            <p className="text-sm text-slate-400 mt-2">Sign up to compile, edit, and collaborate in real-time.</p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="user_name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Username
            </label>
            <input
              value={user_name}
              onChange={handleUserNameChange}
              type="text"
              id="user_name"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              placeholder="username"
              required
            />
            {user_nameError && (
              <span className="text-xs text-red-400 block mt-1">{user_nameError}</span>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Email Address
            </label>
            <input
              value={email}
              onChange={handleEmailChange}
              type="email"
              id="email"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              placeholder="name@example.com"
              required
            />
            {emailError && (
              <span className="text-xs text-red-400 block mt-1">{emailError}</span>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Password
            </label>
            <input
              value={password}
              onChange={handlePasswordChange}
              type="password"
              id="password"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              placeholder="••••••••"
              required
            />
            {passwordError && (
              <span className="text-xs text-red-400 block mt-1">{passwordError}</span>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="cpassword"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Confirm Password
            </label>
            <input
              value={cpassword}
              onChange={handleCPasswordChange}
              type="password"
              id="cpassword"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              placeholder="••••••••"
              required
            />
            {cpasswordError && (
              <span className="text-xs text-red-400 block mt-1">{cpasswordError}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-600/10"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center pt-2">
            <span className="text-sm text-slate-400">Already have an account? </span>
            <Link className="text-sm text-indigo-400 hover:underline hover:text-indigo-300 font-medium" to="/signin">
              Sign In
            </Link>
          </div>
        </form>
      </div>
=======
    <div className="h-[50rem] w-full dark:bg-black bg-white  dark:bg-grid-small-white/[0.2] bg-grid-small-black/[0.2] relative flex items-center justify-center">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]"></div>
      <Toaster />
      <form className="max-w-sm mx-auto flex-auto" onSubmit={handleSubmit}>
        <p className="text-4xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 py-8">
          Sign Up
        </p>
        <div className="mb-5">
          <label
            htmlFor="user_name"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            User Name
          </label>
          <input
            value={user_name}
            onChange={handleUserNameChange}
            type="text"
            id="user_name"
            className="input"
            placeholder="user name"
            required
          />
          <span
            className={`text-red-500 my-2  ${
              user_nameError ? "visible" : "hidden"
            } `}
          >
            {user_nameError}
          </span>
        </div>
        <div className="mb-5">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your email
          </label>
          <input
            value={email}
            onChange={handleEmailChange}
            type="email"
            id="email"
            className="input"
            placeholder="name@example.com"
            required
          />
          <span
            className={`text-red-500 my-2  ${
              emailError ? "visible" : "hidden"
            } `}
          >
            {emailError}
          </span>
        </div>
        <div className="mb-5">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your password
          </label>
          <input
            placeholder="password"
            value={password}
            onChange={handlePasswordChange}
            type="password"
            id="password"
            className="input"
            required
          />
          <span
            className={`text-red-500 my-2  ${
              passwordError ? "visible" : "hidden"
            } `}
          >
            {passwordError}
          </span>
        </div>
        <div className="mb-5">
          <label
            htmlFor="cpassword"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Confirm password
          </label>
          <input
           placeholder="confirm password"
            value={cpassword}
            onChange={handleCPasswordChange}
            type="password"
            id="cpassword"
            className="input"
            required
          />
            <span
            className={`text-red-500 my-2  ${
              cpasswordError ? "visible" : "hidden"
            } `}
          >
            {cpasswordError}
          </span>
        </div>
        <button type="submit" className="inline-flex items-center justify-center py-2 px-6 font-medium tracking-wide text-black transition duration-200 bg-white rounded-lg hover:bg-gray-800 hover:text-white focus:shadow-outline focus:outline-none">
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      
        <Link className="text-white my-2 block" to="/signin">
          Already have an account? Log in
        </Link>
      </form>
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
    </div>
  );
};

export default SignUp;
