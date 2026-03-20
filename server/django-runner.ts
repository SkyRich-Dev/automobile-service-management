import { spawn, execSync, ChildProcess } from "child_process";
import path from "path";

let djangoProcess: ChildProcess | null = null;

function killExistingDjango(): void {
  try {
    execSync("pkill -f 'manage.py runserver' 2>/dev/null || true", { stdio: "ignore" });
  } catch {
  }
}

function runDjangoMigrations(): void {
  const djangoPath = path.resolve(process.cwd(), "backend_django");
  try {
    console.log("Running Django migrations...");
    execSync("python manage.py migrate --noinput 2>&1 || python manage.py migrate --noinput --fake-initial 2>&1 || true", {
      cwd: djangoPath,
      stdio: "inherit",
      shell: "/bin/sh",
      timeout: 60000,
    });
    console.log("Django migrations complete");
  } catch (err) {
    console.error("Migration error (non-fatal, continuing):", err);
  }
}

function seedSampleData(): void {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping sample data seeding in production");
    return;
  }
  const djangoPath = path.resolve(process.cwd(), "backend_django");
  try {
    console.log("Seeding sample data...");
    execSync("python manage.py seed_sample_data", {
      cwd: djangoPath,
      stdio: "inherit",
      timeout: 120000,
    });
    console.log("Sample data seeded successfully");
  } catch (err) {
    console.error("Seed data error (non-fatal):", err);
  }
}

export function startDjango(): Promise<void> {
  return new Promise((resolve, reject) => {
    const djangoPath = path.resolve(process.cwd(), "backend_django");

    console.log("Starting Django server...");

    killExistingDjango();
    try {
      runDjangoMigrations();
    } catch (err) {
      console.error("Migration failed but continuing to start Django:", err);
    }
    try {
      seedSampleData();
    } catch (err) {
      console.error("Seeding failed but continuing to start Django:", err);
    }

    djangoProcess = spawn("python", ["manage.py", "runserver", "0.0.0.0:8000", "--noreload"], {
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
      const errText = data.toString().trim();
      if (errText.includes("Starting development server") || errText.includes("Performing system checks")) {
        console.log(`[Django] ${errText}`);
        if (errText.includes("Starting development server")) {
          resolve();
        }
      } else {
        console.error(`[Django Error] ${errText}`);
      }
    });

    djangoProcess.on("error", (err) => {
      console.error("Failed to start Django:", err);
      reject(err);
    });

    djangoProcess.on("close", (code) => {
      console.log(`Django process exited with code ${code}`);
      djangoProcess = null;
    });

    setTimeout(() => {
      if (djangoProcess) {
        console.log("Django server appears to be running");
        resolve();
      }
    }, 10000);
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
