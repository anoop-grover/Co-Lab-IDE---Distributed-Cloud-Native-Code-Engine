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
exports.deleteFileById = exports.getFilesByUserId = exports.getFileById = exports.saveCode = exports.createFile = exports.status = exports.executeCode = void 0;
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const job_1 = __importDefault(require("../model/job"));
const bullmq_1 = require("bullmq");
const sandbox_1 = require("../model/sandbox");
const dotenv_1 = __importDefault(require("dotenv"));
const jobWorker_1 = require("../workers/jobWorker");
const net_1 = __importDefault(require("net"));
dotenv_1.default.config();
const inst = process.env.ENV;
console.log("Environment: " + inst);
let redisHost = inst === "dev" ? "127.0.0.1" : "redis";
let redisPort = 6379;
let redisPassword = undefined;
if (process.env.REDIS_URL) {
    try {
        const parsedUrl = new URL(process.env.REDIS_URL);
        redisHost = parsedUrl.hostname;
        redisPort = Number(parsedUrl.port) || 6379;
        if (parsedUrl.password) {
            redisPassword = decodeURIComponent(parsedUrl.password);
        }
    }
    catch (err) {
        console.error("Failed to parse REDIS_URL:", err.message);
    }
}
else {
    if (process.env.REDIS_HOST) {
        redisHost = process.env.REDIS_HOST;
    }
    if (process.env.REDIS_PORT) {
        redisPort = Number(process.env.REDIS_PORT) || 6379;
    }
    if (process.env.REDIS_PASSWORD) {
        redisPassword = process.env.REDIS_PASSWORD;
    }
}
const connectionOptions = {
    host: redisHost,
    port: redisPort,
};
if (redisPassword) {
    connectionOptions.password = redisPassword;
}
if (process.env.REDIS_URL && (process.env.REDIS_URL.startsWith("rediss://") || process.env.REDIS_TLS === "true")) {
    connectionOptions.tls = {};
}
const jobQueue = new bullmq_1.Queue("jobQueue", {
    connection: connectionOptions
});
// Catch connection errors to prevent server crash
jobQueue.on('error', (err) => {
    // console.log("BullMQ jobQueue redis connection error:", err.message);
});
// Lightweight TCP ping to check if Redis is active
const checkRedisReady = () => {
    return new Promise((resolve) => {
        const client = net_1.default.createConnection({ host: redisHost, port: redisPort }, () => {
            client.end();
            resolve(true);
        });
        client.on('error', () => {
            resolve(false);
        });
        client.setTimeout(1000);
        client.on('timeout', () => {
            client.destroy();
            resolve(false);
        });
    });
};
exports.executeCode = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, language, input } = req.body;
    const userId = req.user._id;
    if (!code || !language) {
        throw new apiError_1.ApiError(400, "Code and language are required");
    }
    const job = yield job_1.default.create({ code, language, userId, input: input || "" });
    res.status(200).json({ jobId: job._id });
    const isRedisReady = yield checkRedisReady();
    if (isRedisReady) {
        try {
            yield jobQueue.add("job", job);
        }
        catch (queueError) {
            console.log("Redis queue add failed. Running job locally in-process:", queueError.message);
            setTimeout(() => {
                (0, jobWorker_1.processJobData)(job).catch(err => console.error("In-process job execution error:", err));
            }, 0);
        }
    }
    else {
        console.log("Redis is offline. Bypassing queue and running job locally in-process.");
        setTimeout(() => {
            (0, jobWorker_1.processJobData)(job).catch(err => console.error("In-process job execution error:", err));
        }, 0);
    }
}));
exports.status = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const jobId = req.query.jobId;
    if (!jobId)
        throw new apiError_1.ApiError(400, "JobId required");
    const jobFound = yield job_1.default.findById(jobId);
    if (!jobFound)
        throw new apiError_1.ApiError(404, "Job with this id not found");
    return res.status(200).json(new apiResponse_1.ApiResponse(200, "Success", { job: jobFound }, true));
}));
exports.createFile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const title = req.body.title;
    const sandBox = yield sandbox_1.SandBox.create({
        userId: user._id,
        title,
        files: [{ name: "main.js", code: "// Welcome to Co-Lab IDE", language: "javascript" }]
    });
    return res.status(200).json(new apiResponse_1.ApiResponse(201, "Success", { sandBox }, true));
}));
exports.saveCode = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const code = req.body.code;
    const language = req.body.language;
    const files = req.body.files;
    const fileId = req.params.fileId;
    const sandBox = yield sandbox_1.SandBox.findByIdAndUpdate(fileId, { code, language, files }, { new: true });
    return res.status(200).json(new apiResponse_1.ApiResponse(201, "Success", { sandBox }, true));
}));
exports.getFileById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const fileId = req.params.fileId;
    const sandBox = yield sandbox_1.SandBox.findById(fileId);
    return res.status(200).json(new apiResponse_1.ApiResponse(201, "Success", { sandBox }, true));
}));
exports.getFilesByUserId = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const files = yield sandbox_1.SandBox.find({ userId: user._id });
    return res.status(200).json(new apiResponse_1.ApiResponse(201, "Success", { files }, true));
}));
exports.deleteFileById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileId = req.params.fileId;
    if (!fileId)
        throw new apiError_1.ApiError(400, "Provide fileId");
    const file = yield sandbox_1.SandBox.findByIdAndDelete(fileId);
    if (!file)
        throw new apiError_1.ApiError(404, "File not found");
    return res.status(200).json(new apiResponse_1.ApiResponse(200, "Success", { file }, true));
}));
