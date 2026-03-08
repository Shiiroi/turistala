import { apiSlice } from "./apiSlice";

const GOALS_URL = "/api/goals";

export const goalApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserGoals: builder.query({
            query: () => GOALS_URL,
            providesTags: ["Goal"],
        }),
        getUserGoalProgress: builder.query({
            query: () => `${GOALS_URL}/progress`,
            providesTags: ["GoalProgress"],
        }),
        addUserGoal: builder.mutation({
            query: (data) => ({
                url: GOALS_URL,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Goal", "GoalProgress"],
        }),
        removeUserGoal: builder.mutation({
            query: ({ placeId, municityId }) => ({
                url: `${GOALS_URL}/${placeId}`,
                method: "DELETE",
            }),
            async onQueryStarted(
                { placeId, municityId },
                { dispatch, queryFulfilled },
            ) {
                // Optimistically remove the goal
                const patchResult = dispatch(
                    goalApiSlice.util.updateQueryData(
                        "getUserGoals",
                        undefined,
                        (draft) => {
                            const index = draft.data.findIndex(
                                (g) => g.place_id === placeId,
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
                "Goal",
                "GoalProgress",
                { type: "Journal", id: arg.municityId },
            ],
        }),
        updateUserGoalStatus: builder.mutation({
            query: ({ placeId, isVisited }) => ({
                url: `${GOALS_URL}/${placeId}/status`,
                method: "PATCH",
                body: { isVisited },
            }),
            async onQueryStarted(
                { placeId, isVisited },
                { dispatch, queryFulfilled },
            ) {
                const patchResult = dispatch(
                    goalApiSlice.util.updateQueryData(
                        "getUserGoals",
                        undefined,
                        (draft) => {
                            const goal = draft.data.find(
                                (g) => g.place_id === placeId,
                            );
                            if (goal) goal.is_visited = isVisited;
                        },
                    ),
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: ["Goal", "GoalProgress"],
        }),
    }),
});

export const {
    useGetUserGoalsQuery,
    useGetUserGoalProgressQuery,
    useAddUserGoalMutation,
    useRemoveUserGoalMutation,
    useUpdateUserGoalStatusMutation,
} = goalApiSlice;
