const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();

// import { v4 as uuidv4 } from 'uuid';

const http = require("http");

const server = http.createServer(app);
const { initSocket } = require("./src/socket"); // <-- Import socket initializer
initSocket(server); // <-- Initialize socket.io with the HTTP server

const router  = require("./src/router/router");

app.use(cors({
  origin: ['http://localhost:4200/', "https://code-analyzer-frontend.onrender.com" ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
    res.status(500).json({message:"Something went wrong"})
  }
});

app.use(router);



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server Started at Port ", PORT);
});
