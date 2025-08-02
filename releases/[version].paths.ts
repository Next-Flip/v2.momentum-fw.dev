import { devbuildReleases, mainlineReleases } from "../_data/releases";

export default {
    paths: () => {
        const paths: { params: { version: string } }[] = [];

        for (const release of mainlineReleases) {
            paths.push({
                params: {
                    version: release.version,
                },
            });
        }

        for (const release of devbuildReleases.slice(0, 50)) {
            paths.push({
                params: {
                    version: release.version,
                },
            });
        }

        return paths;
    },
};
