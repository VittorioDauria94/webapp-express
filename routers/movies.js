import express from "express";
import movieController from "../controllers/movieController.js";

const router = express.Router();

router.get("/", movieController.index);
router.get("/:slug", movieController.show);
router.post("/", movieController.store);

export default router;
