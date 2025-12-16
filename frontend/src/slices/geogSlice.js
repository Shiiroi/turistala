import { apiSlice } from './apiSlice';
import { MUNICIPALITIES_URL } from '../constants';

export const geogApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMunicipalities: builder.query({
            query: () => ({
                url: MUNICIPALITIES_URL,
            }),
            // This ONLY runs if status is 200 OK.
            // If status is 500, this line is skipped entirely.
            transformResponse: (response) => response.data,
            keepUnusedDataFor: 3600,
            providesTags: ['Municipality'],
        }),
    })
})

export const {
    useGetMunicipalitiesQuery
} = geogApiSlice;
