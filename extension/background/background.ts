/**
 * Background Service Worker
 * Acts as a bridge for API calls to bypass Mixed Content restrictions
 */

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FETCH_ANALYSIS') {
        const { url, options } = message.payload;

        fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Backend error: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                console.error('[Background] Fetch error:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Keep message channel open for async response
    }
});
