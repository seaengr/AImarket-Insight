import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'index.html'),
                content: resolve(__dirname, 'content/inject.tsx'),
                background: resolve(__dirname, 'background/background.ts'),
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'content') {
                        return 'content/inject.js';
                    }
                    return '[name].js';
                },
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                        return 'content/[name][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
            },
        },
        copyPublicDir: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, '.'),
        },
    },
});
