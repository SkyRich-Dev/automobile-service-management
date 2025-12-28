import { spawn, ChildProcess } from "child_process";
import path from "path";

let djangoProcess: ChildProcess | null = null;

export function startDjango(): Promise<void> {
  return new Promise((resolve, reject) => {
    const djangoPath = path.resolve(process.cwd(), "backend_django");
    
    console.log("Starting Django server...");
    
    djangoProcess = spawn("python", ["manage.py", "runserver", "0.0.0.0:8000"], {
      cwd: djangoPath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    djangoProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Starting development server")) {
        console.log("Django server started successfully");
        resolve();
      }
      console.log(`[Django] ${output.trim()}`);
    });

    djangoProcess.stderr?.on("data", (data) => {
      console.error(`[Django Error] ${data.toString().trim()}`);
    });

    djangoProcess.on("error", (err) => {
      console.error("Failed to start Django:", err);
      reject(err);
    });

    djangoProcess.on("close", (code) => {
      console.log(`Django process exited with code ${code}`);
      djangoProcess = null;
    });

    // Resolve after 5 seconds if Django doesn't output the ready message
    setTimeout(() => {
      if (djangoProcess) {
        console.log("Django server appears to be running");
        resolve();
      }
    }, 5000);
  });
}

export function stopDjango(): void {
  if (djangoProcess) {
    djangoProcess.kill("SIGTERM");
    djangoProcess = null;
  }
}

process.on("exit", () => {
  stopDjango();
});

process.on("SIGINT", () => {
  stopDjango();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopDjango();
  process.exit(0);
});
