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
exports.processJobData = exports.executeLocally = exports.validateCodeSecurity = void 0;
const bullmq_1 = require("bullmq");
const apiError_1 = require("../utils/apiError");
const dockerode_1 = __importDefault(require("dockerode"));
const job_1 = __importDefault(require("../model/job"));
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
dotenv_1.default.config();
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const validateCodeSecurity = (language, code) => {
    const lang = language.toLowerCase();
    const normalized = code.replace(/\s+/g, "").toLowerCase();
    // Python blacklists
    if (lang === "python") {
        const forbidden = ["os.system", "subprocess.", "shutil.", "pty.", "eval(", "exec(", "importos", "importsys", "importsubprocess", "importshutil", "fromosimport", "fromsubprocessimport"];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: Execution of dangerous modules or commands (${word}) is prohibited in local execution mode.`);
            }
        }
    }
    // JavaScript / TypeScript blacklists
    if (lang === "javascript" || lang === "typescript" || lang === "node") {
        const forbidden = ["child_process", "fs.", "eval(", "process.", "require('cluster')", "global.", "require(\"cluster\")", "require('fs')", "require(\"fs\")", "require('child_process')", "require(\"child_process\")"];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: Execution of file system or shell operations (${word}) is prohibited in local execution mode.`);
            }
        }
    }
    // Java blacklists
    if (lang === "java") {
        const forbidden = ["runtime.getruntime", "processbuilder", "system.exit", "java.io.file", "java.nio.file", "java.io.defaultfilesystem", "java.io.tmpdir"];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: System operations or file system manipulations (${word}) are prohibited in local execution mode.`);
            }
        }
    }
    // C / C++ blacklists
    if (lang === "c" || lang === "cpp") {
        const forbidden = ["system(", "popen(", "fork(", "exec(", "windows.h", "process.h", "std::system", "::system"];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: Execution of system commands or process spawning (${word}) is prohibited in local execution mode.`);
            }
        }
    }
    // Go blacklists
    if (lang === "go") {
        const forbidden = ["os/exec", "syscall", "net/http", "net.", "import\"os\"", "import\"syscall\"", "import\"net\"", "import\"net/http\""];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: System execution or networking calls (${word}) are prohibited in Go local execution mode.`);
            }
        }
    }
    // Rust blacklists
    if (lang === "rust") {
        const forbidden = ["std::process", "std::fs", "std::net", "useprocess", "usefs", "usenet"];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: Process execution or file access (${word}) is prohibited in Rust local execution mode.`);
            }
        }
    }
    // Ruby blacklists
    if (lang === "ruby") {
        const forbidden = ["system", "exec", "spawn", "io.popen", "require'socket'", "require'net'"];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: Command execution or socket operations (${word}) are prohibited in Ruby local execution mode.`);
            }
        }
    }
    // PHP blacklists
    if (lang === "php") {
        const forbidden = ["exec", "system", "shell_exec", "passthru", "proc_open", "popen", "file_get_contents", "fsockopen"];
        for (const word of forbidden) {
            if (normalized.includes(word)) {
                throw new Error(`Security Policy: Shell execution or external operations (${word}) are prohibited in PHP local execution mode.`);
            }
        }
    }
};
exports.validateCodeSecurity = validateCodeSecurity;
const executeLocally = (language, code, input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, exports.validateCodeSecurity)(language, code);
    }
    catch (secError) {
        return secError.message;
    }
    const tempDir = path_1.default.join(process.cwd(), 'temp_bin');
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir, { recursive: true });
    }
    const rand = Math.random().toString(36).substring(7);
    // Create stdin file if input is provided
    const inputPath = input ? path_1.default.join(tempDir, `input_${rand}.txt`) : '';
    if (inputPath) {
        fs_1.default.writeFileSync(inputPath, input);
    }
    const pipeSuffix = inputPath ? ` < "${inputPath}"` : '';
    try {
        switch (language.toLowerCase()) {
            case 'javascript': {
                const filePath = path_1.default.join(tempDir, `run_${rand}.js`);
                fs_1.default.writeFileSync(filePath, code);
                const { stdout, stderr } = yield execPromise(`node "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                try {
                    fs_1.default.unlinkSync(filePath);
                }
                catch (_a) { }
                try {
                    if (inputPath)
                        fs_1.default.unlinkSync(inputPath);
                }
                catch (_b) { }
                return (stdout + stderr).trim();
            }
            case 'python': {
                const filePath = path_1.default.join(tempDir, `run_${rand}.py`);
                fs_1.default.writeFileSync(filePath, code);
                const { stdout, stderr } = yield execPromise(`python "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                try {
                    fs_1.default.unlinkSync(filePath);
                }
                catch (_c) { }
                try {
                    if (inputPath)
                        fs_1.default.unlinkSync(inputPath);
                }
                catch (_d) { }
                return (stdout + stderr).trim();
            }
            case 'java': {
                const javaDir = path_1.default.join(tempDir, `java_${rand}`);
                fs_1.default.mkdirSync(javaDir, { recursive: true });
                const filePath = path_1.default.join(javaDir, 'Main.java');
                fs_1.default.writeFileSync(filePath, code);
                let javaPipeSuffix = '';
                if (input) {
                    const javaInputPath = path_1.default.join(javaDir, 'input.txt');
                    fs_1.default.writeFileSync(javaInputPath, input);
                    javaPipeSuffix = ` < input.txt`;
                }
                const { stdout, stderr } = yield execPromise(`javac Main.java && java Main${javaPipeSuffix}`, { cwd: javaDir, timeout: 5000 });
                try {
                    fs_1.default.rmSync(javaDir, { recursive: true, force: true });
                }
                catch (_e) { }
                try {
                    if (inputPath)
                        fs_1.default.unlinkSync(inputPath);
                }
                catch (_f) { }
                return (stdout + stderr).trim();
            }
            case 'c': {
                const filePath = path_1.default.join(tempDir, `main_${rand}.c`);
                const exePath = path_1.default.join(tempDir, `main_${rand}.exe`);
                fs_1.default.writeFileSync(filePath, code);
                try {
                    yield execPromise(`gcc "${filePath}" -o "${exePath}"`, { timeout: 5000 });
                    const { stdout, stderr } = yield execPromise(`"${exePath}"${pipeSuffix}`, { timeout: 5000 });
                    try {
                        fs_1.default.unlinkSync(filePath);
                        fs_1.default.unlinkSync(exePath);
                    }
                    catch (_g) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_h) { }
                    return (stdout + stderr).trim();
                }
                catch (err) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_j) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_k) { }
                    return "C compilation failed. Please ensure GCC is installed on the system, or run with Docker. Details: " + err.message;
                }
            }
            case 'cpp': {
                const filePath = path_1.default.join(tempDir, `main_${rand}.cpp`);
                const exePath = path_1.default.join(tempDir, `main_${rand}.exe`);
                fs_1.default.writeFileSync(filePath, code);
                try {
                    yield execPromise(`g++ "${filePath}" -o "${exePath}"`, { timeout: 5000 });
                    const { stdout, stderr } = yield execPromise(`"${exePath}"${pipeSuffix}`, { timeout: 5000 });
                    try {
                        fs_1.default.unlinkSync(filePath);
                        fs_1.default.unlinkSync(exePath);
                    }
                    catch (_l) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_m) { }
                    return (stdout + stderr).trim();
                }
                catch (err) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_o) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_p) { }
                    return "C++ compilation failed. Please ensure G++ is installed on the system, or run with Docker. Details: " + err.message;
                }
            }
            case 'typescript': {
                const filePath = path_1.default.join(tempDir, `run_${rand}.ts`);
                fs_1.default.writeFileSync(filePath, code);
                try {
                    const { stdout, stderr } = yield execPromise(`npx -y ts-node "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_q) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_r) { }
                    return (stdout + stderr).trim();
                }
                catch (err) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_s) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_t) { }
                    return "TypeScript run failed. Please ensure ts-node is available. Details: " + err.message;
                }
            }
            case 'go': {
                const filePath = path_1.default.join(tempDir, `main_${rand}.go`);
                fs_1.default.writeFileSync(filePath, code);
                try {
                    const { stdout, stderr } = yield execPromise(`go run "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_u) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_v) { }
                    return (stdout + stderr).trim();
                }
                catch (err) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_w) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_x) { }
                    return "Go run failed. Please ensure Go is installed. Details: " + err.message;
                }
            }
            case 'rust': {
                const filePath = path_1.default.join(tempDir, `main_${rand}.rs`);
                const exePath = path_1.default.join(tempDir, `main_${rand}.exe`);
                fs_1.default.writeFileSync(filePath, code);
                try {
                    yield execPromise(`rustc "${filePath}" -o "${exePath}"`, { timeout: 5000 });
                    const { stdout, stderr } = yield execPromise(`"${exePath}"${pipeSuffix}`, { timeout: 5000 });
                    try {
                        fs_1.default.unlinkSync(filePath);
                        fs_1.default.unlinkSync(exePath);
                    }
                    catch (_y) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_z) { }
                    return (stdout + stderr).trim();
                }
                catch (err) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_0) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_1) { }
                    return "Rust compilation failed. Please ensure Rust is installed. Details: " + err.message;
                }
            }
            case 'ruby': {
                const filePath = path_1.default.join(tempDir, `run_${rand}.rb`);
                fs_1.default.writeFileSync(filePath, code);
                try {
                    const { stdout, stderr } = yield execPromise(`ruby "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_2) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_3) { }
                    return (stdout + stderr).trim();
                }
                catch (err) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_4) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_5) { }
                    return "Ruby run failed. Details: " + err.message;
                }
            }
            case 'php': {
                const filePath = path_1.default.join(tempDir, `run_${rand}.php`);
                fs_1.default.writeFileSync(filePath, code);
                try {
                    const { stdout, stderr } = yield execPromise(`php "${filePath}"${pipeSuffix}`, { timeout: 5000 });
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_6) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_7) { }
                    return (stdout + stderr).trim();
                }
                catch (err) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                    }
                    catch (_8) { }
                    try {
                        if (inputPath)
                            fs_1.default.unlinkSync(inputPath);
                    }
                    catch (_9) { }
                    return "PHP run failed. Details: " + err.message;
                }
            }
            case 'html': {
                try {
                    if (inputPath)
                        fs_1.default.unlinkSync(inputPath);
                }
                catch (_10) { }
                return "Frontend HTML code ready for iframe rendering preview.";
            }
            default:
                throw new apiError_1.ApiError(400, "Unsupported language");
        }
    }
    catch (error) {
        try {
            if (inputPath)
                fs_1.default.unlinkSync(inputPath);
        }
        catch (_11) { }
        return (error.stderr || error.stdout || error.message || "Execution error").trim();
    }
});
exports.executeLocally = executeLocally;
const processJobData = (jobData) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id, language, code, input } = jobData;
    const startedAt = new Date();
    try {
        let output;
        try {
            // Try local first if Docker isn't running
            const docker = new dockerode_1.default();
            yield docker.ping();
            let image;
            let command;
            if (language.toLowerCase() === 'html') {
                output = "Frontend HTML code ready for iframe rendering preview.";
            }
            else {
                switch (language.toLowerCase()) {
                    case 'javascript':
                        image = 'node';
                        command = ['node', '-e', code];
                        break;
                    case 'typescript':
                        image = 'node';
                        command = ['bash', '-c', `npm install -g ts-node typescript && echo '${code}' > run.ts && ts-node run.ts`];
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
                    case 'go':
                        image = 'golang:latest';
                        command = ['bash', '-c', `echo '${code}' > main.go && go run main.go`];
                        break;
                    case 'rust':
                        image = 'rust:latest';
                        command = ['bash', '-c', `echo '${code}' > main.rs && rustc main.rs && ./main`];
                        break;
                    case 'ruby':
                        image = 'ruby:latest';
                        command = ['ruby', '-e', code];
                        break;
                    case 'php':
                        image = 'php:cli';
                        command = ['php', '-r', code];
                        break;
                    default:
                        throw new apiError_1.ApiError(400, "Unsupported language");
                }
                const container = yield docker.createContainer({
                    Image: image,
                    Tty: false,
                    AttachStdout: true,
                    AttachStderr: true,
                    Cmd: command,
                    HostConfig: {
                        NetworkMode: 'none',
                        Memory: 128 * 1024 * 1024, // 128MB
                        MemorySwap: 128 * 1024 * 1024, // Disable swap overflow
                        NanoCpus: 500000000 // 0.5 CPU
                    }
                });
                yield container.start();
                const executionPromise = container.wait();
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new apiError_1.ApiError(500, "Time Limit Exceeded, Maximum 5 Seconds"));
                    }, 5000);
                });
                yield Promise.race([executionPromise, timeoutPromise]);
                const logs = yield container.logs({ stdout: true, stderr: true });
                output = logs.toString('utf-8').trim();
                try {
                    yield container.remove({ force: true });
                }
                catch (_12) { }
            }
        }
        catch (dockerError) {
            console.log("Docker not active. Using local compiler with stdin support.");
            output = yield (0, exports.executeLocally)(language, code, input || "");
        }
        yield job_1.default.findByIdAndUpdate(_id, {
            startedAt,
            completedAt: new Date(),
            status: "success",
            output
        });
    }
    catch (err) {
        yield job_1.default.findByIdAndUpdate(_id, {
            startedAt,
            completedAt: new Date(),
            status: "failed",
            output: err.message
        });
    }
});
exports.processJobData = processJobData;
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
const worker = new bullmq_1.Worker("jobQueue", (job) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.processJobData)(job.data);
}), {
    connection: connectionOptions
});
worker.on('error', (err) => {
    // console.log("BullMQ worker redis connection error:", err.message);
});
