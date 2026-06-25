import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";
<<<<<<< HEAD
import { User } from '../model/user';
import bcrypt from 'bcrypt';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '')
        console.log("Connected to DB")

        // Seed guest user if not present
        const guestEmail = "coderbro@gmail.com";
        const guestUser = await User.findOne({ email: guestEmail });
        if (!guestUser) {
            const hashPass = await bcrypt.hash("123456", 10);
            await User.create({
                email: guestEmail,
                user_name: "coderbro",
                password: hashPass
            });
            console.log("Guest user successfully seeded!");
        }
    } catch (error) {
        console.log("DB connection error:", error);
        process.exit(1);
    }
=======
export const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI||'')
        console.log("Connected to DB")
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
    
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
}