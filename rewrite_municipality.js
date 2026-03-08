const fs = require('fs');
const file = '/Users/vince/turistala/frontend/src/components/MunicipalityDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

const startTokens = "            {mapMode === \"province\" && !subTownId ? (";
const endTokens = `{/* Add a specific Place Form */}`;

const startIndex = content.indexOf(startTokens);
const endIndex = content.indexOf(endTokens);

let newContent = content.substring(0, startIndex) + 
`<div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">

                    {isProvinceOverview && (
                        <div className="mb-2">
                            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">
                                Target Municipality
                            </label>
                            <select
                                value={newPlaceCityId}
                                onChange={(e) => setNewPlaceCityId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-500 mb-2"
                            >
                                <option value="">-- Select Municipality for New Place --</option>
                                {childMunicipalities.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* Add a specific Place Form */}` + content.substring(endIndex + endTokens.length);

fs.writeFileSync(file, newContent, 'utf8');
