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
