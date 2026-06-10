/**
 * Build GeoJSON from CSV seeds and upload to Supabase Storage (public geo bucket).
 *
 * Requires:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: pnpm upload:geo
 */
import { createClient } from "@supabase/supabase-js";
import {
    loadMunicitiesGroupedByProvince,
    loadProvincesFromCsv,
    loadRegionsFromCsv,
} from "./geoLayersFromCsv";

const BUCKET = "geo";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function uploadJson(path: string, data: unknown) {
    const body = JSON.stringify(data);
    const bytes = Buffer.byteLength(body, "utf8");
    const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
        contentType: "application/json",
        cacheControl: "3600",
        upsert: true,
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    console.log(`  ${path} — ${Math.round(bytes / 1024)} KB → ${urlData.publicUrl}`);
}

async function main() {
    console.log(`Uploading geo layers to bucket "${BUCKET}"…`);

    const regions = await loadRegionsFromCsv();
    await uploadJson("regions.json", regions);

    const provinces = await loadProvincesFromCsv();
    await uploadJson("provinces.json", provinces);

    console.log("Loading municities from CSV (this may take a minute)…");
    const { meta, byProvince } = await loadMunicitiesGroupedByProvince();
    await uploadJson("municities/meta.json", meta);

    const provinceIds = Array.from(byProvince.keys()).sort((a, b) => a - b);
    await uploadJson("municities/manifest.json", { provinceIds });

    console.log(`Uploading ${provinceIds.length} province municity files…`);
    for (const provinceId of provinceIds) {
        await uploadJson(`municities/province-${provinceId}.json`, byProvince.get(provinceId)!);
    }

    console.log("Done.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
