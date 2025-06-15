const fs = require('fs');
const path = require('path');
const axios = require('axios');



const AdmZip = require('adm-zip');

// 🔐 Your Gemini API Key
const API_KEY = 'AIzaSyCYYSQb0PR56YJBXitW7FswXVwqYyqciMk'; // Replace with your actual key

// 📁 Project Config
// const PROJECT_PATH = 'C:/code/angular/my-app'; // Update as needed
//const INCLUDE_EXTENSIONS = ['.ts', '.js', '.html', '.css', '.json'];
const INCLUDE_EXTENSIONS = [
  // JavaScript / TypeScript / Web Frameworks (React, Angular, Vue, etc.)
  '.js', '.jsx', '.ts', '.tsx',
  '.html', '.css', '.scss', '.sass', '.less',

  // Config & Tooling for JS Ecosystem
  '.json',        // package.json, tsconfig.json, etc.
  '.babelrc',     // Babel config
  '.eslintrc',    // ESLint config
  '.prettierrc',  // Prettier config
  '.env',         // Environment variables
  '.nvmrc',       // Node version manager
  '.npmrc',       // NPM config
  '.yarnrc',      // Yarn config
  '.lock',        // package-lock.json, yarn.lock, pnpm-lock.yaml

  // Angular-specific
  '.module.ts', '.component.ts', '.component.html', '.component.scss',

  // Python
  '.py',
  '.ipynb',       // Jupyter notebook
  'requirements.txt', 'Pipfile', 'pyproject.toml', 'setup.py',

  // Java / Spring Boot
  '.java', '.kt', '.xml', '.properties', '.yml', '.yaml',
  'pom.xml', 'build.gradle', 'settings.gradle', 'application.yml',

  // PHP
  '.php', '.blade.php',
  'composer.json', 'composer.lock',

  // C# / .NET
  '.cs', '.csproj', '.sln', '.config', '.resx', '.json',

  // Dart / Flutter
  '.dart',
  'pubspec.yaml', 'analysis_options.yaml',

  // Go
  '.go',
  'go.mod', 'go.sum',

  // Ruby / Rails
  '.rb', '.erb', '.rake', '.gemspec',
  'Gemfile', 'Gemfile.lock',

  // Vue
  '.vue',

  // Markdown / Docs
  '.md', '.markdown',

  // Docker & DevOps
  'Dockerfile', 'docker-compose.yml',
  '.dockerignore',
  '.gitignore',

  // CI/CD
  '.yml', '.yaml',  // GitHub Actions, CircleCI, TravisCI
  '.gitlab-ci.yml', 'Jenkinsfile',

  // Misc / Project Files
  '.sh', '.bat', '.cmd', '.ini',
  '.editorconfig',
  '.tsbuildinfo'
];

const EXCLUDE_PATTERNS = ['.spec.ts', 'node_modules', 'dist', 'package-lock.json'];

// 📦 Step 1: Recursively get files
function readDirAsync(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

async function getFiles(dir) {
  console.log('DIR ', dir);
  let results = [];
  const entries = await readDirAsync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (EXCLUDE_PATTERNS.some(p => fullPath.includes(p))) continue;

    if (entry.isDirectory()) {
      const nested = await getFiles(fullPath);
      results = results.concat(nested);
    } else {
      const ext = path.extname(entry.name);
      if (INCLUDE_EXTENSIONS.includes(ext)) {
        const content = await readFileAsync(fullPath);
        results.push({ path: fullPath, content });
      }
    }
  }

  return results;
}
// 🧠 Step 2: Format full project context
function buildPrompt(files, PROJECT_PATH) {
  const tree = files.map(f => `- ${path.relative(PROJECT_PATH, f.path)}`).join('\n');
  console.log(tree)
  const codeSections = files
    .map(f => `// File: ${path.relative(PROJECT_PATH, f.path)}\n${f.content}`)
    .join('\n\n');

  return `
You are an expert AI code reviewer.

Analyze the following full project code and return a JSON object with **two properties**: 

1. **projectMetaData**:
   - projectType: Type of project (e.g., "Full-stack Web App", "Frontend SPA", "Backend API", "Mobile App", etc.)
   - technologiesUsed: List of technologies detected (e.g., Angular, React, Node.js, Express, MongoDB, Java, Spring Boot, etc.)
   - probableProjectName: Infer a probable project name based on folder structure, filenames, or file content.
   - projectPurpose: Short description (2–3 lines) about what the project likely does or is intended for, based on code and filenames.

2. **codeAnalysis**: An array of code issues. You can include bad coding standards, bugs, improvements, suggestions, vulnerabilities, suggested coding standards, bad technical designs, or issues that may break the application.

For each issue in codeAnalysis:
- file: relative path to the file
- issueName within 3-4 words
- issue: brief summary of the issue (max 20 lines)
- severity: Critical | High | Medium | Low
- originalCode: a short code snippet with the issue 
- suggestedFix: a corrected version of the code
- explanation: clear and helpful explanation to an average developer

❗Important:
- Ignore empty lines in the code and your response.
- Only return **valid JSON**. Do NOT wrap it in markdown. Do NOT include any introductory or ending text.
- Do NOT return anything other than the JSON.
- Do NOT add any single letters or characters outside the JSON.
- Your entire response must be a single valid JSON object with { projectMetaData, codeAnalysis }.

 Project Tree:
${tree}

Full Code:
${codeSections}

`.trim();
}

async function sendToGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await axios.post(url, {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      console.log('\n✅ AI Response:\n');
      const cleanedJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
     
      return cleanedJson
    } else {
      console.error('❌ Unexpected API response:', JSON.stringify(response.data, null, 2));
    //   throw Error('❌ Unexpected API response:')
    }
  } catch (error) {
    console.error('❌ Gemini API Error:', error.response?.data || error.message);
     throw Error('❌ Gemini API Error:'+ error.response?.data || error.message)
  }
}

async function fetchRepoFromGitHub(gitUrl, outputDir = 'uploads') {
  try {
    console.log('heyeyyyy')
    const repoMatch = gitUrl.match(/github\.com\/(.+\/.+)\.git$/);
    if (!repoMatch) throw new Error('Invalid GitHub URL format');

    const repo = repoMatch[1]; // e.g., "user/repo"
    const repoName = repo.split('/')[1];
    const apiUrl = `https://api.github.com/repos/${repo}`;

    // Get default branch (e.g., main or master)
    const repoData = await axios.get(apiUrl);
    const branch = repoData.data.default_branch;

    // Build ZIP URL
    const zipUrl = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;

    // Ensure output directory exists
    const outputPath = path.join(__dirname, outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Download ZIP and write it to file
    const zipRes = await axios.get(zipUrl, { responseType: 'arraybuffer' });
    const zipFileName = `${repoName}.zip`;
    const tempZipPath = path.join(outputPath, zipFileName);
    fs.writeFileSync(tempZipPath, zipRes.data);

    // Return relative path
    const relativeZipPath = path.join(outputDir, zipFileName);
    console.log('ZIP downloaded:', relativeZipPath);
    return relativeZipPath;
  } catch (error) {
    console.error('Failed to fetch GitHub repo:', error.message);
    throw error;
  }
}

function extractZipToOriginal(zipPath) {
  const folderName = path.basename(zipPath, path.extname(zipPath)); // removes .zip
  const extractTo = path.join(path.dirname(zipPath), folderName);   // same dir as zip

  if (!fs.existsSync(extractTo)) {
    fs.mkdirSync(extractTo, { recursive: true });
  }

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);

  console.log(`✅ Extracted to: ${extractTo}`);
  return extractTo; // Return path for further processing
}


module.exports = {  getFiles, buildPrompt , sendToGemini, fetchRepoFromGitHub, extractZipToOriginal}