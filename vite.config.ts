import * as fs from "node:fs";
import * as path from "node:path";
import { defineConfig, Plugin } from "vite";

function ProcessExitPlugin(): Plugin {
    return {
        name: "ProcessExitPlugin",

        buildEnd(error?: Error) {
            if (error) {
                console.error("Build failed:", error);
                process.exit(1);
            }
        },

        closeBundle() {
            const checkForCompletion = () => {
                const distPath = path.resolve(process.cwd(), ".vitepress/dist");
                const indexPath = path.join(distPath, "index.html");
                const notFoundPath = path.join(distPath, "404.html");

                if (fs.existsSync(indexPath) && fs.existsSync(notFoundPath)) {
                    console.log("VitePress build completed - exiting...");
                    process.exit(0);
                } else {
                    setTimeout(checkForCompletion, 500);
                }
            };

            setTimeout(checkForCompletion, 1000);
        },
    };
}

export default defineConfig({
    plugins: [ProcessExitPlugin()],
});
