import { generateConfigs } from "./config";
import { updateLocaleLinks } from "./locales";
import { fetchReleases } from "./releases";
import { fetchAssetPacks, patchVueIcons, updateBuildInfo } from "./utils";

async function main(): Promise<void> {
    const startTime = Date.now();

    try {
        if (process.env.SKIP_FETCH !== "true") {
            console.log("Fetching asset packs...");
            await fetchAssetPacks();
            console.log("Fetching releases...");
            await fetchReleases();
        } else {
            console.log("Skipping fetch operations (SKIP_FETCH=true)");
        }
        console.log("Updating locale links...");
        await updateLocaleLinks();
        console.log("Generating VitePress configs...");
        await generateConfigs();
        console.log("Updating build info...");
        await updateBuildInfo();
        console.log("Patching oh-vue-icons...");
        await patchVueIcons();
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`Prebuild completed successfully in ${duration}s`);
        process.exit(0);
    } catch (error) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.error(`❌ Prebuild failed after ${duration}s:`, error);
        process.exit(1);
    }
}

main();
