/**
 * Background Service Worker
 * Acts as a bridge for API calls to bypass Mixed Content restrictions
 */

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FETCH_ANALYSIS') {
        const { url, options } = message.payload;

        fetch(url, options)
            .then(async response => {
                if (!response.ok) {
                    const errorJson = await response.json().catch(() => ({}));
                    throw new Error(errorJson.error || `Backend error: ${response.statusText}`);
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

        return true;
    }

    if (message.type === 'CAPTURE_SCREEN') {
        chrome.tabs.captureVisibleTab(undefined as any, { format: 'jpeg', quality: 80 }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error('[Background] Capture failed:', chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, dataUrl });
            }
        });
        return true;
    }
});
