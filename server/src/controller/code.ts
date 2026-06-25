import { Response, Request } from "express";
import { CustomRequest } from "../types/CustomRequest";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import Job from "../model/job";
import { Queue } from 'bullmq';
import { SandBox } from "../model/sandbox";
import dotenv from 'dotenv';
import { processJobData } from "../workers/jobWorker";
import net from 'net';

dotenv.config();
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
    } catch (err: any) {
        console.error("Failed to parse REDIS_URL:", err.message);
    }
} else {
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

const connectionOptions: any = {
    host: redisHost,
    port: redisPort,
};
if (redisPassword) {
    connectionOptions.password = redisPassword;
}
if (process.env.REDIS_URL && (process.env.REDIS_URL.startsWith("rediss://") || process.env.REDIS_TLS === "true")) {
    connectionOptions.tls = {};
}

const jobQueue = new Queue("jobQueue", {
    connection: connectionOptions
});

// Catch connection errors to prevent server crash
jobQueue.on('error', (err) => {
    // console.log("BullMQ jobQueue redis connection error:", err.message);
});

// Lightweight TCP ping to check if Redis is active
const checkRedisReady = (): Promise<boolean> => {
    return new Promise((resolve) => {
        const client = net.createConnection({ host: redisHost, port: redisPort }, () => {
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

export const executeCode = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { code, language, input } = req.body;
    const userId = req.user!._id;
    if (!code || !language) {
        throw new ApiError(400, "Code and language are required");
    }
    const job = await Job.create({ code, language, userId, input: input || "" });
    res.status(200).json({ jobId: job._id });
    
    const isRedisReady = await checkRedisReady();
    if (isRedisReady) {
        try {
            await jobQueue.add("job", job);
        } catch (queueError: any) {
            console.log("Redis queue add failed. Running job locally in-process:", queueError.message);
            setTimeout(() => {
                processJobData(job).catch(err => console.error("In-process job execution error:", err));
            }, 0);
        }
    } else {
        console.log("Redis is offline. Bypassing queue and running job locally in-process.");
        setTimeout(() => {
            processJobData(job).catch(err => console.error("In-process job execution error:", err));
        }, 0);
    }
});

export const status = asyncHandler(async (req: Request, res: Response) => {
    const jobId = req.query.jobId;
    if (!jobId)
        throw new ApiError(400, "JobId required");
    const jobFound = await Job.findById(jobId);
    if (!jobFound)
        throw new ApiError(404, "Job with this id not found");
    return res.status(200).json(new ApiResponse(200, "Success", { job: jobFound }, true));
})

export const createFile = asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = req.user;
    const title = req.body.title;
    const sandBox = await SandBox.create({ 
        userId: user!._id, 
        title,
        files: [{ name: "main.js", code: "// Welcome to Co-Lab IDE", language: "javascript" }]
    });
    return res.status(200).json(new ApiResponse(201, "Success", { sandBox }, true));
})

export const saveCode = asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = req.user;
    const code = req.body.code;
    const language = req.body.language;
    const files = req.body.files;
    const fileId = req.params.fileId;
    const sandBox = await SandBox.findByIdAndUpdate(fileId, { code, language, files }, { new: true });
    return res.status(200).json(new ApiResponse(201, "Success", { sandBox }, true))
})

export const getFileById = asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = req.user;
    const fileId = req.params.fileId;
    const sandBox = await SandBox.findById(fileId);
    return res.status(200).json(new ApiResponse(201, "Success", { sandBox }, true));
})

export const getFilesByUserId = asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = req.user;
    const files = await SandBox.find({ userId: user!._id });
    return res.status(200).json(new ApiResponse(201, "Success", { files }, true));
})

export const deleteFileById = asyncHandler(async (req: Request, res: Response) => {
    const fileId = req.params.fileId;
    if (!fileId)
        throw new ApiError(400, "Provide fileId");
    const file = await SandBox.findByIdAndDelete(fileId);
    if (!file)
        throw new ApiError(404, "File not found");
    return res.status(200).json(new ApiResponse(200, "Success", { file }, true));
})