import express from "express";
import { stateManager } from "./state";
import { fetchMappings, fetchState } from "./apiCalls";

const app = express();

// Fetch mappings when the application starts
fetchMappings();

// setInterval(() => {
//   if (stateManager.get("mappings")) {
//     fetchState();
//   }
// }, 5000);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/state", (req, res) => {
  res.json(stateManager.getAll());
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
