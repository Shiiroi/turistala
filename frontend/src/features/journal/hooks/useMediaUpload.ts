// React Query mutation for journal photo uploads.

import { useMutation } from "@tanstack/react-query";
import { uploadJournalPhoto } from "../services/journalApi";

 /**
  * React hook providing states and handlers for mediaupload.
  * @returns Value or promise returned by useMediaUpload.
 */
export function useMediaUpload() {
    return useMutation({
        mutationFn: ({
            file,
            userId,
            journalId,
            displayOrder,
        }: {
            file: File;
            userId: string;
            journalId: string;
            displayOrder?: number;
        }) => uploadJournalPhoto(userId, journalId, file, displayOrder ?? 0),
    });
}
