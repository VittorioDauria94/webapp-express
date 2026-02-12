import express from "express";
import movieController from "../controllers/movieController.js";
import upload from "../middlewares/handleImageUpload.js";

const router = express.Router();

router.get("/", movieController.index);
router.get("/:slug", movieController.show);
router.post("/", upload.single("image"), movieController.store);

export default router;
