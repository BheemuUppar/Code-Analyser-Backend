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

module.exports = {INCLUDE_EXTENSIONS, EXCLUDE_PATTERNS}