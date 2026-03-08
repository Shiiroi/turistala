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
            query: (placeId) => ({
                url: `${GOALS_URL}/${placeId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Goal", "GoalProgress"],
        }),
        updateUserGoalStatus: builder.mutation({
            query: ({ placeId, isVisited }) => ({
                url: `${GOALS_URL}/${placeId}/status`,
                method: "PATCH",
                body: { isVisited },
            }),
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
