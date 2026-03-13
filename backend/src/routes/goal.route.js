import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // <-- 1. ADD THIS IMPORT
import {
    addUserGoal,
    getUserGoals,
    getUserGoalProgress,
    removeUserGoal,
    updateUserGoalStatus,
} from "../controllers/goal.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", addUserGoal);
router.get("/", getUserGoals);
router.get("/progress", getUserGoalProgress);
router.patch("/:placeId/status", updateUserGoalStatus);
router.delete("/:placeId", removeUserGoal);

export default router;
