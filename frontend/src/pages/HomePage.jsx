import { useState } from "react"; 
import Map from "../components/Map";
import { useGetMunicipalitiesQuery } from "../slices/geogSlice";
import { Loader } from "../components/Loader";

const HomePage = () => {
  const { data: municipalities = [], isLoading, error } = useGetMunicipalitiesQuery();
  
  const [activeTown, setActiveTown] = useState("");

  return (
    <div className="relative w-full h-screen bg-slate-900">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader />
        </div>
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center text-red-500 font-mono text-xl">
          Error: {error?.data?.message || 'Failed to load map data'}
        </div>
      ) : (
        <>
          <div className="absolute top-10 left-10 z-[1000] pointer-events-none">
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter opacity-80">
              {activeTown}
            </h1>
            <p className="text-xl text-teal-400 font-mono mt-2">
            </p>
          </div>
          <Map 
            municipalities={municipalities} 
            onHover={setActiveTown} 
          />
        </>
      )}
    </div>
  );
};

export default HomePage;