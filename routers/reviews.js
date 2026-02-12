import express from "express";
import reviewController from "../controllers/reviewController.js";

const router = express.Router();

router.post("/:id", reviewController.store);

export default router;
