import express from "express";
import {
    addUserGoal,
    getUserGoals,
    getUserGoalProgress,
    removeUserGoal,
    updateUserGoalStatus,
} from "../controllers/goal.controller.js";

const router = express.Router();

router.post("/", addUserGoal);
router.get("/", getUserGoals);
router.get("/progress", getUserGoalProgress);
router.patch("/:placeId/status", updateUserGoalStatus);
router.delete("/:placeId", removeUserGoal);

export default router;
