import { loader } from '@monaco-editor/react';

// Configure Monaco to load worker scripts from an alternative CDN.
// The default jsDelivr endpoint occasionally fails to respond in some networks,
// which results in a NetworkError when the worker tries to bootstrap.
// Switching to Cloudflare's CDN provides a more reliable fallback without
// changing the editor integration elsewhere in the app.
loader.config({
    paths: {
        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs',
    },
});
