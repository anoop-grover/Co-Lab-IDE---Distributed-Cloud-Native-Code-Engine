import { io } from 'socket.io-client';
<<<<<<< HEAD
const baseURL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
=======
const baseURL = "https://coderunner-sndn.onrender.com/";
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
console.log(baseURL)
export const initSocket = async () => {
    try {
        const options = {
            'force new connection': true,
            reconnectionAttempt: 'Infinity',
            timeout: 10000,
            transports: ['websocket'],
        };
        return io(baseURL, options);
    } catch (error:any) {
        throw new Error(error.message)
    }
};
