import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    addJournalEntry,
    editJournalEntry,
    deleteJournalEntry,
    getJournalEntriesByPlace,
} from "../controllers/journal.controller.js";

const router = Router();

router.use(protect);

// Matches: POST /api/journals
router.route("/").post(addJournalEntry);

// Matches: GET /api/journals/place/:municityId
router.route("/place/:municityId").get(getJournalEntriesByPlace);

// Matches: PUT /api/journals/:journalId and DELETE /api/journals/:journalId
router.route("/:journalId").put(editJournalEntry).delete(deleteJournalEntry);

export default router;
