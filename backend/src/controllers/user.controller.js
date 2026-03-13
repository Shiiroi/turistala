import {
    getUserProfile,
    updateUserMapColor,
} from "../services/user.service.js";

/**
 * @desc   Get current user profile
 * @route  GET /api/users/profile
 * @access Private
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await getUserProfile(userId);

        if (!profile) {
            return res.status(200).json({
                success: true,
                data: { id: userId, map_color: "#ec4899" },
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
 * @access Private
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

        const userId = req.user.id;
        const updatedProfile = await updateUserMapColor(userId, map_color);

        if (!updatedProfile) {
            return res.status(404).json({
                success: false,
                message: "User profile not found in public.users",
            });
        }

        res.status(200).json({ success: true, data: updatedProfile });
    } catch (error) {
        console.error("Error updating map color:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
