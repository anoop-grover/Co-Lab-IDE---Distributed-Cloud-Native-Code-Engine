<<<<<<< HEAD
import { app } from './app';
import dotenv from 'dotenv'
import {connectDB} from './db'

dotenv.config();
const PORT = process.env.PORT || 8000;
connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("Server running at PORT "+PORT);
    })
}).catch((error)=>{
    console.log(error.message)
})
=======
import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";
export const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI||'')
        console.log("Connected to DB")
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
    
}
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
