const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
// import { v4 as uuidv4 } from 'uuid';

const multer = require("multer");
const { tracker } = require("./src/utils");
const http = require("http");

const server = http.createServer(app);
const { initSocket } = require("./src/socket"); // <-- Import socket initializer
initSocket(server); // <-- Initialize socket.io with the HTTP server

const {
  fetchRepoFromGitHub,
} = require("./src/controller");

// Multer setup: Store file in memory
// Custom storage to keep original filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // this preserves the original file name
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
    res.status(500).json({message:"Something went wrong"})
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Server is up");
});

// for zipfile upload
app.post("/analysCode/zipFile", upload.single("zipFile"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    let jobId = uuidv4();
    tracker[jobId] = {
      status: "Uploading File",
      path: req.file.path,
    };
    console.log("JOB ID SENT : ", jobId)
    res.status(201).json({ id: jobId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

// for github link
app.post("/analysCode/remoteRepo", async (req, res) => {
  try {
    let jobId = uuidv4();
    tracker[jobId] = {
      status: "Fetching from Github",
      path: "",
    };
    let zipPath = await fetchRepoFromGitHub(req.body.url);

    tracker[jobId]["status"] = "code fetch successfully";
    tracker[jobId]["path"] = zipPath;
    console.log("JOB ID SENT : ", jobId);
    res.status(201).json({ id: jobId });
  } catch (error) {
    console.log(error.error.message || "Unknown Error");
    res.status(error.error.code).send(error.error.message || "Unknown Error");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server Started at Port ", PORT);
});
