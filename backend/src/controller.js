const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();
const AdmZip = require("adm-zip");
const {INCLUDE_EXTENSIONS, EXCLUDE_PATTERNS} = require('./configuration')

// 🔐 Your Gemini API Key
const API_KEY = process.env.geminiApiKey; // Replace with your actual key




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
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

async function getFiles(dir) {
  // console.log("DIR ", dir);
  let results = [];
  const entries = await readDirAsync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (EXCLUDE_PATTERNS.some((p) => fullPath.includes(p))) continue;

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
  const tree = files
    .map((f) => `- ${path.relative(PROJECT_PATH, f.path)}`)
    .join("\n");
  // console.log(tree);
  const codeSections = files
    .map((f) => `// File: ${path.relative(PROJECT_PATH, f.path)}\n${f.content}`)
    .join("\n\n");

  return `You are an expert AI code reviewer.

Analyze the entire project source code and return a single valid JSON object with two top-level properties:

---

1. "projectMetaData":
- "projectType": Type of project (e.g., "Full-stack Web App", "Frontend SPA", "Backend API", "Mobile App", etc.)
- "technologiesUsed": List of detected technologies and frameworks
- "probableProjectName": Inferred project name from code or file structure
- "projectPurpose": Brief description (2–3 lines) of what the project does

---

2. "codeAnalysis": A **comprehensive array of issues** found in the codebase.  
Do **NOT limit the number of issues**. Include **as many as possible** — especially:
- **Critical**, **High**, and **Medium** severity issues
- Performance, security, architecture, maintainability, bad patterns, technical debt, scalability, and race conditions

Each item in "codeAnalysis" must include:
- "file": Relative file path where the issue is found
- "issueName": Short 3–5 word title
- "issue": Short explanation of the issue (max 15 lines)
- "severity": One of "Critical", "High", "Medium", or "Low"
- "originalCode": Code snippet containing the issue
- "suggestedFix": Revised or corrected code snippet
- "explanation": Clear reasoning that helps a mid-level developer understand the fix

---

Strict Output Rules:
- ✅ Output must be a **single valid JSON object** with keys: "projectMetaData" and "codeAnalysis"
- ❌ Do **NOT** wrap output in json or triple backticks
- ❌ Do **NOT** add comments, formatting, or extra text
- ✅ All keys and values must use proper **double-quoted JSON syntax**
- a cleand json you make it like this JSON.stringfy({projectMetaData:project data,codeAnalysis :data })
- ✅ Include **all issues you can detect** — do not shorten the output for brevity
-- don't send incomplete response, try to make it valid json
---

📁 Project Tree:
${tree}

📄 Full Code:
${codeSections}
`
}
// import { GoogleGenerativeAI } from "@google/generative-ai";
const GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;

const genAI = new GoogleGenerativeAI(API_KEY.trim());

async function sendToGemini(prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 1,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Remove code block markers
    const cleanedJson = text
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err.message);
      throw new Error("Invalid JSON output from AI");
    }

    return parsed;
  } catch (error) {
    console.error("❌ Gemini SDK Error:", error.message);
    throw error;
  }
}

async function fetchRepoFromGitHub(gitUrl, outputDir = "uploads") {
  try {
    
    const repoMatch = gitUrl.match(/github\.com\/(.+\/.+)\.git$/);
    if (!repoMatch) throw new Error("Invalid GitHub URL format");
  // console.log("git url : ", gitUrl);
  // console.log("repo match : ", gitUrl)
    const repo = repoMatch[1]; // e.g., "user/repo"
    const repoName = repo.split("/")[1];
    const apiUrl = `https://api.github.com/repos/${repo}`;

    // Get default branch (e.g., main or master)
    const repoData = await axios.get(apiUrl);
    const branch = repoData.data.default_branch;

    // Build ZIP URL
    const zipUrl = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;

    // Ensure output directory exists
    const outputPath = path.join(__dirname, outputDir);
    console.log("Resolved output path:", outputPath);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Download ZIP and write it to file
    const zipRes = await axios.get(zipUrl, { responseType: "arraybuffer" });
    // console.log('headers : ', zipRes.headers["content-type"])
    const zipFileName = `${repoName}.zip`;
    const tempZipPath = path.join(outputPath, zipFileName);
    console.log(tempZipPath)
    fs.writeFileSync(tempZipPath, zipRes.data);

    // Return relative path
    const relativeZipPath = path.join(outputDir, zipFileName);
    // console.log("ZIP downloaded:", relativeZipPath);
    return relativeZipPath;
  } catch (error) {
    console.error("Failed to fetch GitHub repo:", error);
    throw error;
  }
}

function extractZipToOriginal(zipPath) {
  
  const folderName = path.basename(zipPath, path.extname(zipPath)); // removes .zip
  const extractTo = path.join(path.dirname(zipPath), folderName); // same dir as zip

  if (!fs.existsSync(extractTo)) {
    fs.mkdirSync(extractTo, { recursive: true });
  }

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);

  console.log(`✅ Extracted to: ${extractTo}`);
  return extractTo; // Return path for further processing
}

module.exports = {
  getFiles,
  buildPrompt,
  sendToGemini,
  fetchRepoFromGitHub,
  extractZipToOriginal,
};
