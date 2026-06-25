<<<<<<< HEAD
import { Worker } from 'bullmq';
import { ApiError } from "../utils/apiError";
import Docker from 'dockerode';
import Job, { IJob } from "../model/job";
import dotenv from 'dotenv';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

dotenv.config();

const execPromise = promisify(exec);

export const executeLocally = async (language: string, code: string, input: string): Promise<string> => {
    const tempDir = path.join(process.cwd(), 'temp_bin');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const rand = Math.random().toString(36).substring(7);
    
    // Create stdin file if input is provided
    const inputPath = input ? path.join(tempDir, `input_${rand}.txt`) : '';
    if (inputPath) {
        fs.writeFileSync(inputPath, input);
    }
    const pipeSuffix = inputPath ? ` < "${inputPath}"` : '';

    try {
        switch (language.toLowerCase()) {
            case 'javascript': {
                const filePath = path.join(tempDir, `run_${rand}.js`);
                fs.writeFileSync(filePath, code);
                const { stdout, stderr } = await execPromise(`node "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                try { fs.unlinkSync(filePath); } catch {}
                try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
                return (stdout + stderr).trim();
            }
            case 'python': {
                const filePath = path.join(tempDir, `run_${rand}.py`);
                fs.writeFileSync(filePath, code);
                const { stdout, stderr } = await execPromise(`python "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                try { fs.unlinkSync(filePath); } catch {}
                try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
                return (stdout + stderr).trim();
            }
            case 'java': {
                const javaDir = path.join(tempDir, `java_${rand}`);
                fs.mkdirSync(javaDir, { recursive: true });
                const filePath = path.join(javaDir, 'Main.java');
                fs.writeFileSync(filePath, code);
                
                let javaPipeSuffix = '';
                if (input) {
                    const javaInputPath = path.join(javaDir, 'input.txt');
                    fs.writeFileSync(javaInputPath, input);
                    javaPipeSuffix = ` < input.txt`;
                }

                const { stdout, stderr } = await execPromise(`javac Main.java && java Main${javaPipeSuffix}`, { cwd: javaDir, timeout: 5000 });
                try {
                    fs.rmSync(javaDir, { recursive: true, force: true });
                } catch {}
                try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
                return (stdout + stderr).trim();
            }
            case 'c': {
                const filePath = path.join(tempDir, `main_${rand}.c`);
                const exePath = path.join(tempDir, `main_${rand}.exe`);
                fs.writeFileSync(filePath, code);
                try {
                    await execPromise(`gcc "${filePath}" -o "${exePath}"`, { timeout: 5000 });
                    const { stdout, stderr } = await execPromise(`"${exePath}"${pipeSuffix}`, { timeout: 5000 });
                    try { fs.unlinkSync(filePath); fs.unlinkSync(exePath); } catch {}
                    try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
                    return (stdout + stderr).trim();
                } catch (err: any) {
                    try { fs.unlinkSync(filePath); } catch {}
                    try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
                    return "C compilation failed. Please ensure GCC is installed on the system, or run with Docker. Details: " + err.message;
                }
            }
            case 'cpp': {
                const filePath = path.join(tempDir, `main_${rand}.cpp`);
                const exePath = path.join(tempDir, `main_${rand}.exe`);
                fs.writeFileSync(filePath, code);
                try {
                    await execPromise(`g++ "${filePath}" -o "${exePath}"`, { timeout: 5000 });
                    const { stdout, stderr } = await execPromise(`"${exePath}"${pipeSuffix}`, { timeout: 5000 });
                    try { fs.unlinkSync(filePath); fs.unlinkSync(exePath); } catch {}
                    try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
                    return (stdout + stderr).trim();
                } catch (err: any) {
                    try { fs.unlinkSync(filePath); } catch {}
                    try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
                    return "C++ compilation failed. Please ensure G++ is installed on the system, or run with Docker. Details: " + err.message;
                }
            }
            default:
                throw new ApiError(400, "Unsupported language");
        }
    } catch (error: any) {
        try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
        return (error.stderr || error.stdout || error.message || "Execution error").trim();
    }
};

export const processJobData = async (jobData: any) => {
    const { _id, language, code, input } = jobData;
    const startedAt = new Date();
    
    try {
        let output: string;
        try {
            // Try local first if Docker isn't running
            const docker = new Docker();
            await docker.ping();
            
            let image: string;
            let command: string[];
            switch (language.toLowerCase()) {
                case 'javascript':
                    image = 'node';
                    command = ['node', '-e', code];
                    break;
                case 'java':
                    image = 'openjdk';
                    command = ['bash', '-c', `echo '${code}' > Main.java && javac Main.java && java Main`];
                    break;
                case 'cpp':
                    image = 'gcc';
                    command = ['bash', '-c', `echo '${code}' > main.cpp && g++ main.cpp -o main && ./main`];
                    break;
                case 'python':
                    image = 'python:latest';
                    command = ['bash', '-c', `echo '${code}' > script.py && python script.py`];
                    break;
                case 'c':
                    image = 'gcc';
                    command = ['bash', '-c', `echo '${code}' > main.c && gcc main.c -o main && ./main`];
                    break;
                default:
                    throw new ApiError(400, "Unsupported language");
            }
            
            const container = await docker.createContainer({
                Image: image,
                Tty: false,
                AttachStdout: true,
                AttachStderr: true,
                Cmd: command,
            });
            await container.start();
            
            const executionPromise = container.wait();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new ApiError(500, "Time Limit Exceeded, Maximum 5 Seconds"));
                }, 5000);
            });
            
            await Promise.race([executionPromise, timeoutPromise]);
            const logs = await container.logs({ stdout: true, stderr: true });
            output = logs.toString('utf-8').trim();
            
            try {
                await container.remove({ force: true });
            } catch {}
        } catch (dockerError: any) {
            console.log("Docker not active. Using local compiler with stdin support.");
            output = await executeLocally(language, code, input || "");
        }
        
        await Job.findByIdAndUpdate(_id, {
            startedAt,
            completedAt: new Date(),
            status: "success",
            output
        });
    } catch (err: any) {
        await Job.findByIdAndUpdate(_id, {
            startedAt,
            completedAt: new Date(),
            status: "failed",
            output: err.message
        });
    }
};

const inst = process.env.ENV;

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

const worker = new Worker("jobQueue", async (job) => {
    await processJobData(job.data);
}, {
    connection: connectionOptions
});

worker.on('error', (err) => {
    // console.log("BullMQ worker redis connection error:", err.message);
});
=======
import {Worker} from 'bullmq';
import { ApiError } from "../utils/apiError";
import Docker from 'dockerode';
import Job, {IJob} from "../model/job";
import dotenv from 'dotenv'


dotenv.config();
const worker = new Worker("jobQueue",async (job)=>{
    const docker = new Docker();
    let image:string;
    let command:string[];
    const data:IJob = job.data;
    const {language,code} = data;
    
    if (!code || !language) {
        throw new ApiError(400, "Code and language are required");
    }

    switch (language.toLowerCase()) {
        case 'javascript':
            image = 'node';
            command = ['node', '-e', code];
            break;
        case 'java':
            image = 'openjdk';
            command = ['bash', '-c', `echo '${code}' > Main.java && javac Main.java && java Main`];
            break;
        case 'cpp':
            image = 'gcc';
            command = ['bash', '-c', `echo '${code}' > main.cpp && g++ main.cpp -o main && ./main`];
            break;
        case 'python':
            image = 'python:latest';
            command = ['bash', '-c', `echo '${code}' > script.py && python script.py`];
            break;
        case 'c':
            image = 'gcc';
            command = ['bash', '-c', `echo '${code}' > main.c && gcc main.c -o main && ./main`];
            break;
        default:
            throw new ApiError(400, "Unsupported language");
    }
    
    const containerConfig = {
        Image: image,
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        Cmd: command,
    };
    try {
        data.startedAt = new Date();
        const container = await docker.createContainer(containerConfig);
        await container.start();
         // Use Promise.race to enforce the time limit
        const executionPromise = container.wait();
        const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new ApiError(500, "Time Limit Exceeded, Maximum 5 Seconds"));
        }, 5000);
        });

        // Wait for either the execution to complete or the timeout to occur
        await Promise.race([executionPromise, timeoutPromise]);

        const containerLogs = await container.logs({ stdout: true, stderr: true });
        const containerResult = containerLogs.toString('utf-8').trim();
        // console.log(containerResult);
        data["completedAt"] = new Date();
        data["status"] = "success";
        data["output"] = containerResult;
        await Job.findByIdAndUpdate(data._id,data);
    } catch (error:any) { 
        data["completedAt"] = new Date();
        data["output"] = error.message;
        data["status"] = "failed";
        await Job.findByIdAndUpdate(data._id,data);
        throw new ApiError(500,JSON.stringify(error.message));
    }
},{
    connection:{
        
        host: process.env.ENV==="dev"?"0.0.0.0":"redis",
        port:6379
    }
} ) 
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
