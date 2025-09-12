<script setup lang="ts">
import { computed, inject, onMounted, ref, watchEffect } from "vue";
import { packs } from "../../../_data/packs.ts";
import type { AssetPack, AssetPackFile } from "../types";
import { AssetPackEntry } from "../types.ts";

import { useI18n, useProxiedUrl, useSerialConnection } from "../composables";
import { ConnectionState } from "../types";
import AssetPacksGrid from "./AssetPacksGrid.vue";

const { tr } = useI18n();

const assetPacks = ref<AssetPackEntry[]>(packs);
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const connectionData = computed(
    () =>
        serialConnection?.connectionData || {
            state: ConnectionState.DISCONNECTED,
            installedPacks: {},
        },
);

const hasLoadedInstalledPacks = ref(false);
const loadingInstalledPacks = ref(false);
const loadInstalledIfConnected = async () => {
    if (
        serialConnection &&
        connectionData.value.state === "connected" &&
        !hasLoadedInstalledPacks.value &&
        !loadingInstalledPacks.value
    ) {
        try {
            loadingInstalledPacks.value = true;
            if (serialConnection.loadInstalledPacks) {
                await serialConnection.loadInstalledPacks();
            }
            hasLoadedInstalledPacks.value = true;
        } catch (error) {
            console.warn("[AssetPacks] Failed to load installed packs:", error);
        } finally {
            loadingInstalledPacks.value = false;
        }
    }
};

const mappedAssetPacks = computed<AssetPack[]>(() => {
    const { installedPacks } = connectionData.value;

    return assetPacks.value.map((pack: AssetPackEntry): AssetPack => {
        const zipFile: AssetPackFile | undefined =
            (pack.zipFile as AssetPackFile) ||
            (pack.files?.find((file: AssetPackFile) => file.type === "pack_zip") as AssetPackFile);
        const tarFile: AssetPackFile | undefined =
            (pack.tarFile as AssetPackFile) ||
            (pack.files?.find(
                (file: AssetPackFile) => file.type === "pack_targz",
            ) as AssetPackFile);

        let downloadUrl = "";

        if (zipFile) {
            downloadUrl = zipFile.url || zipFile.path || "";
            if (zipFile.sha256 && !downloadUrl.includes("sha256=")) {
                downloadUrl = `${downloadUrl}?sha256=${zipFile.sha256}`;
            }
        } else if (pack.files && pack.files.length > 0) {
            const firstFile = pack.files[0];
            downloadUrl = firstFile.url || firstFile.path || "";
            if (firstFile.sha256 && !downloadUrl.includes("sha256=")) {
                downloadUrl = `${downloadUrl}?sha256=${firstFile.sha256}`;
            }
        }

        const previewUrls = Array.isArray(pack.preview_urls)
            ? pack.preview_urls.map((url: string) => useProxiedUrl(url || "/fallback.png"))
            : [useProxiedUrl("/fallback.png")];

        const installedManifest =
            installedPacks && typeof installedPacks === "object"
                ? installedPacks[pack.id]
                : undefined;
        const isInstalled = !!installedManifest;
        const hasUpdate = isInstalled && installedManifest.sha256 !== tarFile.sha256;

        return {
            id: String(pack.id || pack.name?.toLowerCase().replace(/\s+/g, "-") || "unknown"),
            name: pack.name,
            author: pack.author || "",
            description: pack.description,
            imageUrl: previewUrls[0] || useProxiedUrl("/fallback.png"),
            previewUrls: previewUrls,
            downloadUrl: useProxiedUrl(downloadUrl),
            githubUrl: pack.source_url || "",
            updatedTimestamp: pack.stats?.updated,
            addedTimestamp: pack.stats?.added,
            stats: {
                ...pack.stats,
                folders: pack.stats?.folders || [],
            },
            installed: isInstalled,
            hasUpdate: hasUpdate,
            tarFile: tarFile
                ? {
                      url: useProxiedUrl(tarFile.url || tarFile.path || ""),
                      sha256: tarFile.sha256 || "",
                  }
                : undefined,
        };
    });
});

watchEffect(() => {
    if (!serialConnection) return;

    const isConnected = connectionData.value.state === "connected";

    if (connectionData.value.state === "disconnected") {
        hasLoadedInstalledPacks.value = false;
        loadingInstalledPacks.value = false;
    }

    if (isConnected && !hasLoadedInstalledPacks.value && !loadingInstalledPacks.value) {
        loadInstalledIfConnected();
    }
});

onMounted(async () => {
    if (assetPacks.value && Array.isArray(assetPacks.value) && assetPacks.value.length > 0) {
        const hasFiles = assetPacks.value.some((pack) => {
            if (!pack || !pack.files) return false;
            const hasZip = pack.files.some((f) => f && f.type === "pack_zip");
            const hasTar = pack.files.some((f) => f && f.type === "pack_targz");
            return hasZip || hasTar;
        });
        if (hasFiles) {
            await loadInstalledIfConnected();
        }
    }
});
</script>

<template>
    <div>
        <div class="relative my-0 asset-packs-container mx-auto">
            <AssetPacksGrid :title="tr('asset_packs')" :asset-packs="mappedAssetPacks" />
        </div>
    </div>
</template>

<style scoped>
.asset-packs-container > * {
    position: relative;
    z-index: 2;
    min-height: calc(100vh - var(--vp-nav-height));
}

@media (min-width: 768px) {
    .asset-packs-page {
        margin: 128px 0;
    }
}

.asset-packs-page {
    max-width: 1200px;
    margin: 46px auto;
    padding: 0 20px;
}
</style>
