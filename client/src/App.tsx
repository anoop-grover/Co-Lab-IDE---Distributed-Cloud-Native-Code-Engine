import { useEffect } from 'react'
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from 'react-router-dom'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Layout from './components/Layout'
import { useAppSelector, useAppDispatch } from './app/hooks'
import { logout } from './app/slices/authSlice'
import Hello from './pages/Hello'
import SandBox from './pages/SandBox'
import CreateFile from './pages/CreateFile'
import JoinRoom from './pages/JoinRoom'
import CollabarativeSandBox from './pages/CollabarativeSandBox'
import ErrorBoundary from './components/Error'

// Helper function to decode JWT token payload natively
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

function App() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;

    const payload = parseJwt(token);
    if (!payload || !payload.exp) return;

    const expirationTime = payload.exp * 1000;
    const timeLeft = expirationTime - Date.now();

    if (timeLeft <= 0) {
      dispatch(logout());
    } else {
      const timer = setTimeout(() => {
        dispatch(logout());
        alert("Your session has expired. Please sign in again.");
      }, timeLeft);

      return () => clearTimeout(timer);
    }
  }, [token, dispatch]);
  const router = createBrowserRouter(createRoutesFromElements(
    <Route path='/' element={<Layout/>}>
      <Route path='' element={user ? <Home user={user}/> : <Hello/>}/>
      <Route path='signin' element={!user ? <SignIn/> : <Navigate to="/"/>}/>
      <Route path='signup' element={!user ? <SignUp/> : <Navigate to="/"/>}/>
      <Route path='sandbox' element={user ? <SandBox/> : <Navigate to="/"/>}/>
      <Route path='sandbox/create' element={user ? <CreateFile/> : <Navigate to="/"/>}/>
      <Route path="sandbox/:userId/:fileId" element={user ? <SandBox/> : <Navigate to="/"/>}/>
      <Route path='collab' element={user ? <JoinRoom/> : <Navigate to="/"/>}/>
      <Route path='collab/:roomId' element={user ? <CollabarativeSandBox/> : <Navigate to="/"/>}/>
      <Route path='*' element={<ErrorBoundary/>}/>
    </Route>
  ));

  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}

export default App
