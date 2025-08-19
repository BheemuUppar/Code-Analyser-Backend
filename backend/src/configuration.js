// 📁 Project Config
// const PROJECT_PATH = 'C:/code/angular/my-app'; // Update as needed
//const INCLUDE_EXTENSIONS = ['.ts', '.js', '.html', '.css', '.json'];
const INCLUDE_EXTENSIONS = [
  // JavaScript / TypeScript / Web Frameworks (React, Angular, Vue, etc.)
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",

  // Config & Tooling for JS Ecosystem
  ".json", // package.json, tsconfig.json, etc.
  ".babelrc", // Babel config
  ".eslintrc", // ESLint config
  ".prettierrc", // Prettier config
  ".env", // Environment variables
  ".nvmrc", // Node version manager
  ".npmrc", // NPM config
  ".yarnrc", // Yarn config
  ".lock", // package-lock.json, yarn.lock, pnpm-lock.yaml

  // Angular-specific
  ".module.ts",
  ".component.ts",
  ".component.html",
  ".component.scss",

  // Python
  ".py",
  ".ipynb", // Jupyter notebook
  "requirements.txt",
  "Pipfile",
  "pyproject.toml",
  "setup.py",

  // Java / Spring Boot
  ".java",
  ".kt",
  ".xml",
  ".properties",
  ".yml",
  ".yaml",
  "pom.xml",
  "build.gradle",
  "settings.gradle",
  "application.yml",

  // PHP
  ".php",
  ".blade.php",
  "composer.json",
  "composer.lock",

  // C# / .NET
  ".cs",
  ".csproj",
  ".sln",
  ".config",
  ".resx",
  ".json",

  // Dart / Flutter
  ".dart",
  "pubspec.yaml",
  "analysis_options.yaml",

  // Go
  ".go",
  "go.mod",
  "go.sum",

  // Ruby / Rails
  ".rb",
  ".erb",
  ".rake",
  ".gemspec",
  "Gemfile",
  "Gemfile.lock",

  // Vue
  ".vue",

  // Markdown / Docs
  ".md",
  ".markdown",

  // Docker & DevOps
  "Dockerfile",
  "docker-compose.yml",
  ".dockerignore",
  ".gitignore",

  // CI/CD
  ".yml",
  ".yaml", // GitHub Actions, CircleCI, TravisCI
  ".gitlab-ci.yml",
  "Jenkinsfile",

  // Misc / Project Files
  ".sh",
  ".bat",
  ".cmd",
  ".ini",
  ".editorconfig",
  ".tsbuildinfo",
];


const EXCLUDE_PATTERNS = [
  ".spec.ts",
  "node_modules",
  "dist",
  "package-lock.json",
];

const staticPromt = `
You are an expert AI code reviewer.

Analyze the project source code **deeply** and return a single valid JSON object with exactly two top-level properties:

1. "projectMetaData":
- "projectType": Type of project (e.g., "Full-stack Web App", "Frontend SPA", "Backend API", "Mobile App", etc.)
- "technologiesUsed": List of detected technologies and frameworks
- "probableProjectName": Inferred project name from code or file structure
- "projectPurpose": Brief description (2–3 lines) of what the project does

2. "codeAnalysis": An array of the **most important issues only** (ideally 15–20).
Each item must include:
- "file": Relative file path
- "issueName": Short 3–5 word title
- "issue": Serious explanation of the issue (security, logic, architecture, performance, scalability, or maintainability problems; ignore trivial style or naming issues)
- "severity": One of "Critical", "High", "Medium" or "Low"
- "originalCode": Full snippet where issue occurs
- "suggestedFix": Corrected version of the snippet
- "explanation": Clear reasoning to help a mid-level developer understand why this fix is necessary (2–3 lines)

---

### Output Rules:
- ✅ Always return a **single valid JSON object**
- ✅ Focus on **serious, impactful issues** (security vulnerabilities, architectural flaws, performance bottlenecks, incorrect logic, bad API usage).
- ✅ Keep output **concise and within token limits**.
- ✅ Ensure JSON is **complete, properly closed, and valid**.
- ❌ Do NOT include trivial issues (variable casing, whitespace, minor lint errors).
- ❌ Do NOT wrap output in backticks or comments.
- ❌ Do NOT leave the object half-finished.
`;




module.exports = {INCLUDE_EXTENSIONS, EXCLUDE_PATTERNS, staticPromt}