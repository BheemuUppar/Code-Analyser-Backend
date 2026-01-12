const { Server } = require("socket.io");
const {
  getFiles,
  buildPrompt,
  sendToGemini,
  extractZipToOriginal,

} = require("./controller");

const fs = require('fs')
let io;
const { tracker } = require("./utils");
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register-job", async ({ jobId }) => {
      if (jobId) {
        console.log("Recived a job id in socket : ", jobId);
        tracker[jobId] = { ...tracker[jobId], socketId: socket.id };
       await  jobHandler(jobId)
        // io.to(tracker[jobId].socketId).emit('status-update', {status : tracker[jobId].status });
        // console.log(`Registered jobId ${jobId} with socket ${socket.id}`);
      }
    });

    socket.on("message", (data) => {
      // console.log("Message from client:", data);
      socket.emit("message", `Echo: ${data}`);
    });

    // Clean up when user disconnects
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      // for (const job in jobSocketMap) {
      //   if (jobSocketMap[job] === socket.id) {
      //     delete jobSocketMap[job];
      //     console.log(`Cleaned job ${job} on disconnect`);
      //   }
      // }
    });
  });
}

// Optional: export io instance to emit events from other files
function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
function getSocketIdForJob(jobId) {
  return jobSocketMap[jobId];
}

async function jobHandler(jobId) {
  
  if(!tracker[jobId]){
    return 
  }
  // unzip
   updateStatus(jobId , "Preparing your files...");
   console.log('path : ', tracker[jobId].path)
   const extractTo = extractZipToOriginal(tracker[jobId].path);

  // tracker[jobId].status =  "Deleting Zip file"
  //  io.to(tracker[jobId].socketId).emit('status-update', {status : tracker[jobId].status });
  fs.unlinkSync(tracker[jobId].path);

  console.log("extract path ", extractTo);
  console.log("ZIP DELETED")

  //know which files to scan;
  await delay(2000);
   updateStatus(jobId , "Scanning project contents...")
  const files = await getFiles(extractTo);

  console.log(`✅ Found ${files.length} relevant files.`);
  await delay(2000);
  updateStatus(jobId , "Analyzing files for insights...")
  // build prompt
  const prompt = buildPrompt(files, extractTo);
  console.log("\n🤖 Sending project to Gemini...");

   fs.rmSync(extractTo, {recursive: true } );
   console.log("SOURCE CODE DELETED")
    await delay(2000);
   tracker[jobId].status =  "Processing with AI..."
   updateStatus(jobId , "Processing with AI...")
  // ask gemini
  let response = await sendToGemini(prompt);
    if(response.error){
    updateStatus(jobId , "Your Gemini Api Key Expired")
  }
  // console.log("Gemini response:", response);
  // send completion event
  await delay(2000);
  updateStatus(jobId , "Analysis complete");
  
  await delay(2000);
  io.to(tracker[jobId].socketId).emit('completed', {data:response});

  delete  tracker[jobId];
   // console.log(`Registered jobId ${jobId} with socket ${socket.id}`);
  // res.send(response)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function updateStatus(jobId, status = "processing") {
    console.log("setTimeout triggered at", Date.now());
    if (tracker[jobId]) {
      tracker[jobId].status = status;
      io.to(tracker[jobId].socketId).emit("status-update", { status: tracker[jobId].status });
    }
}

module.exports = { initSocket, getIO, getSocketIdForJob };
