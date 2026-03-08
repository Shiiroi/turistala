import express from "express";
import { getProfile, updateMapColor } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", getProfile);
router.patch("/map-color", updateMapColor);

export default router;
