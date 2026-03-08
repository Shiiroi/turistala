import {
    addJournal,
    editJournal,
    deleteJournal,
    getJournalsByPlace,
} from "../services/journal.service.js";

const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * @desc   Add a new journal entry
 * @route  POST /api/journals
 * @access Public
 */
export const addJournalEntry = async (req, res) => {
    try {
        const { municityId, name, notes, photos } = req.body;
        if (!municityId || !notes) {
            return res.status(400).json({
                success: false,
                message: "Municipality ID and notes/content required.",
            });
        }

        const newJournal = await addJournal(
            HARDCODED_USER_ID,
            municityId,
            name,
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
        const { notes, photos } = req.body;

        const updatedJournal = await editJournal(
            HARDCODED_USER_ID,
            journalId,
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
        await deleteJournal(HARDCODED_USER_ID, journalId);
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
        const journals = await getJournalsByPlace(
            HARDCODED_USER_ID,
            municityId,
        );
        res.status(200).json({ success: true, data: journals });
    } catch (error) {
        console.error("Error fetching journals:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
