import {
    addJournal,
    editJournal,
    deleteJournal,
    getJournalsByPlace,
} from "../services/journal.service.js";

/**
 * @desc   Add a new journal entry
 * @route  POST /api/journals
 * @access Public
 */
export const addJournalEntry = async (req, res) => {
    try {
        const { municityId, name, title, notes, photos } = req.body;
        if (!municityId || !notes) {
            return res.status(400).json({
                success: false,
                message: "Municipality ID and notes/content required.",
            });
        }

        const userId = req.user.id;
        const newJournal = await addJournal(
            userId,
            municityId,
            name,
            title,
            notes,
            photos,
        );
        res.status(201).json({ success: true, data: newJournal });
    } catch (error) {
        console.error("Error adding journal:", error);
        if (error.message.includes("You must")) {
            return res
                .status(400)
                .json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @desc   Edit a journal entry
 * @route  PUT /api/journals/:journalId
 * @access Public
 */
export const editJournalEntry = async (req, res) => {
    try {
        const { journalId } = req.params;
        const { title, notes, photos } = req.body;
        const userId = req.user.id;

        const updatedJournal = await editJournal(
            userId,
            journalId,
            title,
            notes,
            photos,
        );
        res.status(200).json({ success: true, data: updatedJournal });
    } catch (error) {
        if (error.message.includes("not found")) {
            return res
                .status(404)
                .json({ success: false, message: error.message });
        }
        console.error("Error editing journal:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @desc   Delete a journal entry
 * @route  DELETE /api/journals/:journalId
 * @access Public
 */
export const deleteJournalEntry = async (req, res) => {
    try {
        const { journalId } = req.params;
        const userId = req.user.id;

        await deleteJournal(userId, journalId);
        res.status(200).json({
            success: true,
            message: "Journal deleted successfully",
        });
    } catch (error) {
        if (error.message.includes("not found")) {
            return res
                .status(404)
                .json({ success: false, message: error.message });
        }
        console.error("Error deleting journal:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @desc   Get journal entries for a municipality
 * @route  GET /api/journals/place/:municityId
 * @access Public
 */
export const getJournalEntriesByPlace = async (req, res) => {
    try {
        const { municityId } = req.params;
        const userId = req.user.id;
        const entries = await getJournalsByPlace(userId, municityId);
        res.status(200).json({ success: true, data: entries });
    } catch (error) {
        console.error("Error fetching journals:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
