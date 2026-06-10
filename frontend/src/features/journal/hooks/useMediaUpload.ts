import { useMutation } from "@tanstack/react-query";
import { uploadJournalPhoto } from "../services/journalApi";

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
