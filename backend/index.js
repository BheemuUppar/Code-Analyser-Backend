
const express = require('express')
const cors = require('cors')
const app = express();
const fs = require('fs')
require('dotenv').config();

const multer = require('multer');


const {getFiles, buildPrompt , sendToGemini , extractZipToOriginal,fetchRepoFromGitHub} = require('./controller')

// Multer setup: Store file in memory
// Custom storage to keep original filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // this preserves the original file name
  }
});

const upload = multer({ storage });


app.use(cors())
app.use(express.json())
app.get('/', (req, res)=>{
    res.status(200).send("Server is up")
});

// for zipfile upload 
app.post('/analysCode/zipFile', upload.single('zipFile'), async (req, res)=>{
    try {
        if (!req.file) return res.status(400).send('No file uploaded');

    const zipPath = req.file.path;

    // Step 1: Extract to original path
    const extractTo = extractZipToOriginal(zipPath);
    console.log('extract path ', extractTo)
    // Step 2: Run file scanning logic
    const files = await getFiles(extractTo);
    console.log(`✅ Found ${files.length} relevant files.`);

    const prompt = buildPrompt(files, extractTo);
    console.log('\n🤖 Sending project to Gemini...');
   let response =  await sendToGemini(prompt);

    res.send(response)
        

    } catch (error) {
        console.log(error)
    }
})

// for github link
app.post('/analysCode/remoteRepo', async (req, res)=>{
try {
   let zipPath = await  fetchRepoFromGitHub(req.body.url);
   console.log(zipPath)
   // Step 1: Extract to original path
    const extractTo = extractZipToOriginal(zipPath);
    fs.unlinkSync(zipPath)
    console.log('extract path ', extractTo)
    // Step 2: Run file scanning logic
    const files = await getFiles(extractTo);
    console.log(`✅ Found ${files.length} relevant files.`);

    const prompt = buildPrompt(files, extractTo);
    fs.rmSync(extractTo, {recursive: true } )
    console.log('\n🤖 Sending project to Gemini...');
   let response =  await sendToGemini(prompt);

   console.log('Response sent');
    res.send(response)
        
} catch (error) {
    console.log(error)
}
})



app.use((err, req, res, next)=>{
   if(err){
    console.log(err)
   }
})






const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    console.log("Server Started at Port ",PORT )
})


// const INCLUDE_EXTENSIONS = [
//   '.js', '.ts', '.html', '.css', '.scss',       // Web/Angular/React
//   '.py',                                         // Python
//   '.java', '.xml',                               // Java/Spring Boot
//   '.php',                                        // PHP
//   '.cs',                                         // C# / .NET
//   '.dart',                                       // Flutter
//   '.go',                                         // Go
//   '.rb',                                         // Ruby
//   '.vue',                                        // Vue
//   '.json', '.md',                                // Misc
// ];