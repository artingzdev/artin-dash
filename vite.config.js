import { defineConfig } from "vite";

export default defineConfig({
    server: {
        hmr: false,
        watch: {
            usePolling: false
        }
    }
});
