const router  = require('express').Router();
const upload = require('../multer');
const { tracker } = require("../utils");
const { v4: uuidv4 } = require("uuid");

const {
  fetchRepoFromGitHub,
} = require("../controller");


router.get("/", (req, res) => {
  res.status(200).send("Server is up");
});

// for zipfile upload
router.post("/analysCode/zipFile", upload.single("zipFile"), async (req, res) => {
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
router.post("/analysCode/remoteRepo", async (req, res) => {
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

module.exports = router