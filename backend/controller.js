const fs = require("fs");
const path = require("path");
const axios = require("axios");

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
  console.log("DIR ", dir);
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
  console.log(tree);
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
- ✅ Include **all issues you can detect** — do not shorten the output for brevity

---

📁 Project Tree:
${tree}

📄 Full Code:
${codeSections}
`
}

async function sendToGemini(prompt) {
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0, // This tells the model to be deterministic and always return the most likely response (i.e., fewer creative variations).
          topK: 1,
          topP: 1,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      console.log("\n✅ AI Response:\n");
      const cleanedJson = text
        .replace(/```json\s*/g, '')  // Remove ```json with any spacing/newlines
  .replace(/```/g, '')         // Remove trailing ```
  .trim();

        const parsed = JSON.parse(cleanedJson);
      return parsed;
    } else {
      console.error(
        "❌ Unexpected API response:",
        JSON.stringify(response.data, null, 2)
      );
      //   throw Error('❌ Unexpected API response:')
    }
  } catch (error) {
    console.error(
      "❌ Gemini API Error:",
      error.response?.data || error.message
    );
    throw Error("❌ Gemini API Error:" + error.response?.data || error.message);
  }
}

async function fetchRepoFromGitHub(gitUrl, outputDir = "uploads") {
  try {
    console.log("heyeyyyy");
    const repoMatch = gitUrl.match(/github\.com\/(.+\/.+)\.git$/);
    if (!repoMatch) throw new Error("Invalid GitHub URL format");

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
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Download ZIP and write it to file
    const zipRes = await axios.get(zipUrl, { responseType: "arraybuffer" });
    const zipFileName = `${repoName}.zip`;
    const tempZipPath = path.join(outputPath, zipFileName);
    fs.writeFileSync(tempZipPath, zipRes.data);

    // Return relative path
    const relativeZipPath = path.join(outputDir, zipFileName);
    console.log("ZIP downloaded:", relativeZipPath);
    return relativeZipPath;
  } catch (error) {
    console.error("Failed to fetch GitHub repo:", error.message);
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
