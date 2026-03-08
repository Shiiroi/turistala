const fs = require("fs");
let code = fs.readFileSync("frontend/src/pages/HomePage.jsx", "utf8");

const oldRegex =
    /<div className=\"absolute bottom-10 left-10 z-\[1000\] flex flex-col gap-2 pointer-events-auto\">[\s\S]*?<div className=\"grid grid-cols-4 gap-2\">/;

const newStr = `<div className="absolute bottom-10 left-10 z-[1000] flex flex-col gap-2 pointer-events-auto">
                            <button
                                onClick={() => {
                                    setMapMode((m) =>
                                        m === "municity"
                                            ? "province"
                                            : "municity",
                                    );
                                    setSelectedTown(null); // Clear selection on mode change
                                }}
                                className="bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 transition-colors w-fit"
                            >
                                <FaMap className="text-teal-400" />
                                <span className="text-white text-sm font-semibold">
                                    {mapMode === "municity"
                                        ? "Municities Mode"
                                        : "Province Mode"}
                                </span>
                            </button>

                            <div className="relative w-fit flex flex-col justify-end">
                                <button
                                    onClick={() =>
                                        setIsColorMenuOpen(!isColorMenuOpen)
                                    }
                                    className="bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur pl-3 pr-4 py-2 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 transition-colors w-fit"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-slate-500"
                                        style={{ backgroundColor: baseColor }}
                                    />
                                    <span className="text-white text-sm font-semibold">
                                        Map Color
                                    </span>
                                </button>
                                <div
                                    className={\`bg-slate-800/90 backdrop-blur p-4 rounded-xl border border-slate-700 shadow-xl transition-all duration-300 origin-bottom-left absolute bottom-full mb-2 \${
                                        isColorMenuOpen
                                            ? "opacity-100 scale-100 visible"
                                            : "opacity-0 scale-95 invisible"
                                    }\`}
                                >
                                    <div className="grid grid-cols-4 gap-2">`;

if (!code.match(oldRegex)) {
    console.error("Match not found!");
    process.exit(1);
}
code = code.replace(oldRegex, newStr);

// Now find the end of the colors to close the relative wrapper
const closeRegex = /<\/button>\n\s*\)\)\}\n\s*<\/div>\n\s*<\/div>/;

const closeStr = `</button>
                                    ))}
                                </div>
                            </div>
                        </div>`;

code = code.replace(closeRegex, closeStr);

fs.writeFileSync("frontend/src/pages/HomePage.jsx", code);
console.log("Done!");
