import { apiSlice } from "./apiSlice";

const USERS_URL = "/api/users";

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserProfile: builder.query({
            query: () => `${USERS_URL}/profile`,
            providesTags: ["User"],
        }),
        updateMapColor: builder.mutation({
            query: (map_color) => ({
                url: `${USERS_URL}/map-color`,
                method: "PATCH",
                body: { map_color },
            }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const { useGetUserProfileQuery, useUpdateMapColorMutation } =
    userApiSlice;
