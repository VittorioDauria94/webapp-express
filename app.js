import express from "express";
import moviesRouter from "./routers/movies.js";

const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("API di film");
});

app.use("/api/movies", moviesRouter);

app.listen(port, () => {
  console.log(`Il server ascolta alla porta ${port}`);
});
