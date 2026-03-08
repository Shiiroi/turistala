import { apiSlice } from "./apiSlice";
import { MUNICIPALITIES_URL, PROVINCES_URL } from "../constants";

export const geogApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMunicipalities: builder.query({
            query: () => ({
                url: MUNICIPALITIES_URL,
            }),
            transformResponse: (response) => response.data,
            keepUnusedDataFor: 3600,
            providesTags: ["Municipality"],
        }),
        getProvinces: builder.query({
            query: () => ({
                url: PROVINCES_URL,
            }),
            transformResponse: (response) => response.data,
            keepUnusedDataFor: 3600,
            providesTags: ["Province"],
        }),
    }),
});

export const { useGetMunicipalitiesQuery, useGetProvincesQuery } = geogApiSlice;
