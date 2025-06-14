import { generateConfigs } from "./config";
import { generateReleases } from "./releases";
import { fetchAssetPacks, patchVueIcons, updateBuildInfo } from "./utils";

async function main(): Promise<void> {
    const startTime = Date.now();

    try {
        console.log("Fetching asset packs...");
        await fetchAssetPacks();
        console.log("Fetching releases...");
        await generateReleases();
        console.log("Generating VitePress configs...");
        await generateConfigs();
        console.log("Patching oh-vue-icons...");
        await patchVueIcons();
        console.log("Updating build info...");
        await updateBuildInfo();
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
