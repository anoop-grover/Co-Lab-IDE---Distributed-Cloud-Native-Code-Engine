import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";
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
}