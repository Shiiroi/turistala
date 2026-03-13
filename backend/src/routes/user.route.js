import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getProfile, updateMapColor } from "../controllers/user.controller.js";

const router = express.Router();

router.use(protect);

router.get("/profile", getProfile);
router.patch("/map-color", updateMapColor);

export default router;
