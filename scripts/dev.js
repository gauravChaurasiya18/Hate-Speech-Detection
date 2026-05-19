const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const rootDir = path.resolve(__dirname, "..");

const pythonCandidates =
  process.platform === "win32"
    ? [
        { command: process.env.PYTHON, args: [] },
        { command: path.join(rootDir, ".venv", "Scripts", "python.exe"), args: [] },
        { command: path.join(rootDir, "..", ".venv", "Scripts", "python.exe"), args: [] },
        { command: path.join(rootDir, "..", ".venv-1", "Scripts", "python.exe"), args: [] },
        { command: "py", args: ["-3.11"] },
        { command: "python", args: [] }
      ]
    : [
        { command: process.env.PYTHON, args: [] },
        { command: path.join(rootDir, ".venv", "bin", "python"), args: [] },
        { command: path.join(rootDir, "..", ".venv", "bin", "python"), args: [] },
        { command: path.join(rootDir, "..", ".venv-1", "bin", "python"), args: [] },
        { command: "python3.11", args: [] },
        { command: "python3", args: [] }
      ];

const commandExists = ({ command }) => command && (command.includes(path.sep) ? fs.existsSync(command) : true);

const isPython311 = (candidate) => {
  if (!commandExists(candidate)) return false;
  const result = spawnSync(candidate.command, [...candidate.args, "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 3000
  });
  return result.status === 0 && result.stdout.trim() === "3.11";
};

const python = pythonCandidates.find(isPython311) || pythonCandidates.find(commandExists);

if (!python) {
  console.error("No Python interpreter found. Install Python 3.11 or set PYTHON to your Python executable.");
  process.exit(1);
}

const services = [
  { name: "backend", command: npmCommand, args: ["run", "dev"], cwd: path.join(rootDir, "backend") },
  { name: "frontend", command: npmCommand, args: ["run", "dev"], cwd: path.join(rootDir, "frontend") },
  { name: "ml-service", command: python.command, args: [...python.args, "app.py"], cwd: path.join(rootDir, "ml-service") }
];

const children = services.map(({ name, command, args, cwd }) => {
  const child = spawn(command, args, { cwd, stdio: ["inherit", "pipe", "pipe"], shell: process.platform === "win32" });

  child.stdout.on("data", (chunk) => process.stdout.write(prefixChunk(name, chunk)));
  child.stderr.on("data", (chunk) => process.stderr.write(prefixChunk(name, chunk)));
  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code !== 0) process.stderr.write(`[${name}] exited with code ${code}\n`);
  });

  return child;
});

function prefixChunk(name, chunk) {
  return String(chunk)
    .split(/\r?\n/)
    .map((line) => (line ? `[${name}] ${line}` : line))
    .join("\n");
}

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
};

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});
