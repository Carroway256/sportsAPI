import express from "express";
import { stateManager } from "./state";
import { fetchMappings, fetchState } from "./apiCalls";

const app = express();
stateManager.clear();
// Fetch mappings when the application starts
fetchMappings();

setInterval(async () => {
  if (!stateManager.get("shouldFetchNewCycleMap")) {
    await fetchState();
  }
}, 5000);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/state", (req, res) => {
  res.json(stateManager.getAll());
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});

app.get("/client/state", (req, res) => {
  res.json(stateManager.get("state"));
});
