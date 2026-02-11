import express from "express";
import movieController from "../controllers/movieController.js";

const router = express.Router();

router.get("/", movieController.index);
router.get("/:slug", movieController.show);
router.post("/:id/reviews", movieController.storeReview)

export default router;
