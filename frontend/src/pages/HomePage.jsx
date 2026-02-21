import { useState } from "react"; 
import Map from "../components/Map";
import { useGetMunicipalitiesQuery } from "../slices/geogSlice";
import { Loader } from "../components/Loader";


const HomePage = () => {
  // Fetch municipality data from Redux Query API
  const { data: municipalities = [], isLoading, error } = useGetMunicipalitiesQuery();
  
  // State for tracking which municipality is being hovered (for HUD display)
  const [activeTown, setActiveTown] = useState("");
  
  // State for the currently selected municipality (controls sidebar visibility)
  const [selectedTown, setSelectedTown] = useState(null);

  return (
    <div className="relative w-full h-screen bg-slate-900">
      {isLoading ? (
        // Loading state: show centered loader
        <div className="w-full h-full flex items-center justify-center">
          <Loader />
        </div>
      ) : error ? (
        // Error state: show error message
        <div className="w-full h-full flex items-center justify-center text-red-500 font-mono text-xl">
          Error: {error?.data?.message || 'Failed to load map data'}
        </div>
      ) : (
        // Main content: map and sidebar layout
        <div className="flex h-full">
          {/* Map Area - dynamically resizes when sidebar opens/closes */}
          <div className={`relative transition-all duration-500 ease-in-out ${selectedTown ? 'w-2/3' : 'w-full'} h-full`}>
            
            {/* HUD Overlay - displays current municipality name and instructions */}
            <div className="absolute top-10 left-10 z-1000 pointer-events-none">
              <h1 className="text-6xl font-black text-white uppercase tracking-tighter opacity-80">
                {activeTown || selectedTown?.name || "EXPLORE"}
              </h1>
              {!selectedTown && (
                <p className="text-lg text-slate-400 font-mono mt-2">
                  Click a municipality to view details
                </p>
              )}
            </div>

            {/* Map Component - handles all map interactions */}
            <Map 
              municipalities={municipalities} 
              onHover={setActiveTown}
              onSelect={setSelectedTown}
              selectedTown={selectedTown}
            />
          </div>

          {/* Sidebar - slides in from right when municipality is selected */}
          <div 
            className={`h-full bg-slate-800 border-l border-slate-700 overflow-hidden transition-all duration-500 ease-in-out ${
              selectedTown ? 'w-1/3 p-8' : 'w-0 p-0'
            }`}
          >
            {selectedTown && (
              <div className="text-white animate-fade-in">
                {/* Header with municipality name and close button */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-teal-400">{selectedTown.name}</h2>
                    <p className="text-slate-400 text-sm mt-1">{['City','HUC','ICC'].includes(selectedTown.type) ? 'City' : 'Municipality'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedTown(null)} 
                    className="text-slate-400 hover:text-white text-2xl transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Content area with municipality details */}
                <div className="space-y-4">
                  {/* Region and Province display logic */}
                  {(
                    // Show only region when the municipality is HUC/ICC, when province is missing,
                    // or when the DB `region_name` indicates the capital region (rendered as-is)
                    selectedTown.type === 'HUC' || selectedTown.type === 'ICC' || !selectedTown.province_name || selectedTown.region_name?.includes('Capital')
                  ) ? (
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Region</p>
                      <p className="text-xl text-white mt-1">{selectedTown.region_name || '—'}</p>
                    </div>
                  ) : (
                    // Others: Show both region and province
                    <>
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Region</p>
                        <p className="text-xl text-white mt-1">{selectedTown.region_name || '—'}</p>
                      </div>
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Province</p>
                        <p className="text-xl text-white mt-1">{selectedTown.province_name || '—'}</p>
                      </div>
                    </>
                  )}

                  {/* Placeholder for future tourist spots content */}
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