import {
    getUserProfile,
    updateUserMapColor,
} from "../services/user.service.js";

const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * @desc   Get current user profile
 * @route  GET /api/users/profile
 * @access Public
 */
export const getProfile = async (req, res) => {
    try {
        const profile = await getUserProfile(HARDCODED_USER_ID);

        if (!profile) {
            return res.status(200).json({
                success: true,
                data: { id: HARDCODED_USER_ID, map_color: "#ec4899" },
            });
        }
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc   Update user color
 * @route  PATCH /api/users/map-color
 * @access Public
 */
export const updateMapColor = async (req, res) => {
    try {
        const { map_color } = req.body;

        if (!map_color) {
            return res.status(400).json({
                success: false,
                message: "map_color is required.",
            });
        }

        const updatedProfile = await updateUserMapColor(
            HARDCODED_USER_ID,
            map_color,
        );
        res.status(200).json({ success: true, data: updatedProfile });
    } catch (error) {
        console.error("Error updating map color:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
