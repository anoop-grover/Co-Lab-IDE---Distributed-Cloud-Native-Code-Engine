import { Link } from "react-router-dom";
import "../index.css";
import { ChangeEvent, FormEvent, useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { login } from "../app/slices/authSlice";
import { notify } from "../utils/notify";
import { Toaster } from "react-hot-toast";
import { validEmail } from "../utils/validEmail";
import { useMutation } from '@tanstack/react-query'
import useAuthService from "../hooks/useAuth";
import { SparklesCore } from "../components/ui/sparkles";

const SignIn = () => {
  const dispatch = useAppDispatch();
  const { loginUser } = useAuthService();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>): void {
    !validEmail(e.target.value) ? setEmailError("Invalid Email Id") : setEmailError(null);
    setEmail(e.target.value);
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  const { mutate } = useMutation({
    mutationKey: ["signin"],
    mutationFn: loginUser,
    onSuccess: (data) => {
      dispatch(login(data));
      notify("Login Successful", true);
    },
    onError: (data: any) => {
      notify(data.message || "Invalid credentials", false);
      setLoading(false);
    }
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    mutate({ email, password });
  };

  const handleGuestLogin = () => {
    setLoading(true);
    mutate({ email: "coderbro@gmail.com", password: "123456" });
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
      
      {/* Background Sparkles Effect */}
      <div className="w-full absolute inset-0 h-full">
        <SparklesCore
          id="tsparticlessignin"
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

      <div className="relative z-10 w-full max-w-md mx-4 p-8 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Login</h2>
            <p className="text-sm text-slate-400 mt-2">Welcome back! Sign in to access your workspaces.</p>
          </div>

          <div className="space-y-2">
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
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              placeholder="name@example.com"
              required
            />
            {emailError && (
              <span className="text-xs text-red-400 block mt-1">
                {emailError}
              </span>
            )}
          </div>

          <div className="space-y-2">
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
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-600/10"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all duration-200"
            >
              Guest Login
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-sm text-slate-400">Don't have an account? </span>
            <Link className="text-sm text-indigo-400 hover:underline hover:text-indigo-300 font-medium" to="/signup">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
