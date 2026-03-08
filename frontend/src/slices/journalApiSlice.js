import { apiSlice } from "./apiSlice";

const JOURNALS_URL = "/api/journals";

export const journalApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getJournalsByPlace: builder.query({
            query: (municityId) => `${JOURNALS_URL}/place/${municityId}`,
            providesTags: (result, error, municityId) => [
                { type: "Journal", id: municityId },
            ],
        }),
        addJournalEntry: builder.mutation({
            query: (data) => ({
                url: JOURNALS_URL,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Journal", id: arg.municityId },
                "GoalProgress",
                "Goal",
            ],
        }),
        updateJournalEntry: builder.mutation({
            query: ({ journalId, ...data }) => ({
                url: `${JOURNALS_URL}/${journalId}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Journal", id: arg.municityId },
            ],
        }),
        deleteJournalEntry: builder.mutation({
            query: ({ journalId, municityId }) => ({
                url: `${JOURNALS_URL}/${journalId}`,
                method: "DELETE",
            }),
            async onQueryStarted(
                { journalId, municityId },
                { dispatch, queryFulfilled },
            ) {
                const patchResult = dispatch(
                    journalApiSlice.util.updateQueryData(
                        "getJournalsByPlace",
                        municityId,
                        (draft) => {
                            const index = draft.data.findIndex(
                                (j) => j.id === journalId,
                            );
                            if (index !== -1) draft.data.splice(index, 1);
                        },
                    ),
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Journal", id: arg.municityId },
                "GoalProgress",
                "Goal",
            ],
        }),
    }),
});

export const {
    useGetJournalsByPlaceQuery,
    useAddJournalEntryMutation,
    useUpdateJournalEntryMutation,
    useDeleteJournalEntryMutation,
} = journalApiSlice;
