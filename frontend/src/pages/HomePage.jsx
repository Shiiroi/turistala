import { useState } from "react"; 
import Map from "../components/Map";
import { useGetMunicipalitiesQuery } from "../slices/geogSlice";
import { Loader } from "../components/Loader";

const HomePage = () => {
  const { data: municipalities = [], isLoading, error } = useGetMunicipalitiesQuery();
  
  const [activeTown, setActiveTown] = useState("");
  const [selectedTown, setSelectedTown] = useState(null);

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
        <div className="flex h-full">
          {/* Map Area - shrinks when sidebar opens */}
          <div className={`relative transition-all duration-500 ease-in-out ${selectedTown ? 'w-2/3' : 'w-full'} h-full`}>
            
            {/* HUD Overlay */}
            <div className="absolute top-10 left-10 z-[1000] pointer-events-none">
              <h1 className="text-6xl font-black text-white uppercase tracking-tighter opacity-80">
                {activeTown || selectedTown?.name || "EXPLORE"}
              </h1>
              {!selectedTown && (
                <p className="text-lg text-slate-400 font-mono mt-2">
                  Click a municipality to view details
                </p>
              )}
            </div>

            <Map 
              municipalities={municipalities} 
              onHover={setActiveTown}
              onSelect={setSelectedTown}
              selectedTown={selectedTown}
            />
          </div>

          {/* Sidebar - slides in from right */}
          <div 
            className={`h-full bg-slate-800 border-l border-slate-700 overflow-hidden transition-all duration-500 ease-in-out ${
              selectedTown ? 'w-1/3 p-8' : 'w-0 p-0'
            }`}
          >
            {selectedTown && (
              <div className="text-white animate-fade-in">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-teal-400">{selectedTown.name}</h2>
                    <p className="text-slate-400 text-sm mt-1">Municipality</p>
                  </div>
                  <button 
                    onClick={() => setSelectedTown(null)} 
                    className="text-slate-400 hover:text-white text-2xl transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Content */}
                <div className="space-y-4">
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">PSGC Code</p>
                    <p className="text-xl font-mono text-white mt-1">{selectedTown.code}</p>
                  </div>
                  
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Province</p>
                    <p className="text-xl text-white mt-1">{selectedTown.province_name || "—"}</p>
                  </div>

                  {/* Placeholder for future content */}
                  <div className="h-48 bg-slate-700/30 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
                    <span className="text-slate-500 text-sm">Tourist spots coming soon...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;