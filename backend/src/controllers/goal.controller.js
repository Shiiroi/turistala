import {
    addGoal,
    getGoals,
    getGoalProgress,
    removeGoal,
    updateGoalStatus,
} from "../services/goal.service.js";

const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * @desc   Add a new user goal
 * @route  POST /api/goals
 * @access Public
 */
export const addUserGoal = async (req, res) => {
    try {
        const { municityId, name } = req.body;
        if (!municityId || !name) {
            return res.status(400).json({
                success: false,
                message: "Municipality ID and name are required",
            });
        }
        const newGoal = await addGoal(HARDCODED_USER_ID, municityId, name);
        res.status(201).json({ success: true, data: newGoal });
    } catch (error) {
        console.error("Error adding goal:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

/**
 * @desc   Get user's goals
 * @route  GET /api/goals
 * @access Public
 */
export const getUserGoals = async (req, res) => {
    try {
        const goals = await getGoals(HARDCODED_USER_ID);
        res.status(200).json({ success: true, data: goals });
    } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc   Get progress stats
 * @route  GET /api/goals/progress
 * @access Public
 */
export const getUserGoalProgress = async (req, res) => {
    try {
        const progress = await getGoalProgress(HARDCODED_USER_ID);
        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        console.error("Error fetching goal progress:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc   Update a user's goal status
 * @route  PATCH /api/goals/:placeId/status
 * @access Public
 */
export const updateUserGoalStatus = async (req, res) => {
    try {
        const { placeId } = req.params;
        const { isVisited } = req.body;

        if (!placeId || isVisited === undefined) {
            return res.status(400).json({
                success: false,
                message: "Place ID and isVisited are required.",
            });
        }

        const updatedGoal = await updateGoalStatus(
            HARDCODED_USER_ID,
            placeId,
            isVisited,
        );
        res.status(200).json({ success: true, data: updatedGoal });
    } catch (error) {
        if (error.message === "Goal not found.") {
            return res
                .status(404)
                .json({ success: false, message: "Goal not found." });
        }
        console.error("Error updating goal status:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc   Delete a user's goal
 * @route  DELETE /api/goals/:placeId
 * @access Public
 */
export const removeUserGoal = async (req, res) => {
    try {
        const { placeId } = req.params;
        if (!placeId) {
            return res.status(400).json({
                success: false,
                message: "Place ID is required",
            });
        }
        await removeGoal(HARDCODED_USER_ID, placeId);
        res.status(200).json({
            success: true,
            message: "Goal removed successfully",
        });
    } catch (error) {
        if (error.message === "Goal not found.") {
            return res
                .status(404)
                .json({ success: false, message: "Goal not found" });
        }
        console.error("Error removing goal:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
