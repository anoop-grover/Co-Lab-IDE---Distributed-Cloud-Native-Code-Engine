"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = require("../model/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI || '');
        console.log("Connected to DB");
        // Seed guest user if not present
        const guestEmail = "coderbro@gmail.com";
        const guestUser = yield user_1.User.findOne({ email: guestEmail });
        if (!guestUser) {
            const hashPass = yield bcrypt_1.default.hash("123456", 10);
            yield user_1.User.create({
                email: guestEmail,
                user_name: "coderbro",
                password: hashPass
            });
            console.log("Guest user successfully seeded!");
        }
    }
    catch (error) {
        console.log("DB connection error:", error);
        process.exit(1);
    }
});
exports.connectDB = connectDB;
