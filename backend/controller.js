const fs = require('fs');
const path = require('path');
const axios = require('axios');



const AdmZip = require('adm-zip');

// 🔐 Your Gemini API Key
const API_KEY = 'AIzaSyCYYSQb0PR56YJBXitW7FswXVwqYyqciMk'; // Replace with your actual key

// 📁 Project Config
// const PROJECT_PATH = 'C:/code/angular/my-app'; // Update as needed
const INCLUDE_EXTENSIONS = ['.ts', '.js', '.html', '.css', '.json'];
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

Analyze the following full project code and return an array of issues in JSON format.
You can include bad coding standards, bugs, improvements, suggestions, vulnerabilities, suggested coding standards, bad technical designs, issues that break the application.

📌 For each issue:
- file: relative path to the file
- issue: brief summary of the issue (max 20 lines)
- severity: Critical | High | Medium | Low
- originalCode: a short code snippet with the issue 
- suggestedFix: a corrected version of the code
- explanation: clear and helpful explanation to average developer
 ignore empty lines in the code and your response 

Only return valid JSON. Do NOT wrap it in markdown. Do NOT output anything outside the JSON.
donn't add single letter outsinde of data. also don't add things like starting  and ending 

📁 Project Tree:
${tree}

📄 Full Code:
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