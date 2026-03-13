import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants";

export const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        // Redux gives us 'getState' so we can look at the whole store
        const token = getState().auth.token;

        // If a token exists, attach it to the headers
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
    },
});

export const apiSlice = createApi({
    baseQuery,
    tagTypes: ["Municipality", "Goal", "GoalProgress", "Journal", "User"],
    endpoints: (builder) => ({}),
});
