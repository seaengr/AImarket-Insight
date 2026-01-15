/**
 * Alert Utility
 * Handles sound and browser notifications for trade signals.
 */

// Simple beep sound using Web Audio API (no external file needed)
let audioContext: AudioContext | null = null;

export function playAlertSound(type: 'buy' | 'sell' | 'hold' = 'buy'): void {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different tones for different signals
        if (type === 'buy') {
            oscillator.frequency.value = 880; // A5 - Higher pitch for BUY
            oscillator.type = 'sine';
        } else if (type === 'sell') {
            oscillator.frequency.value = 440; // A4 - Lower pitch for SELL
            oscillator.type = 'triangle';
        } else {
            oscillator.frequency.value = 660; // E5 - Neutral for HOLD
            oscillator.type = 'sine';
        }

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.warn('[AI Market Insight] Could not play alert sound:', error);
    }
}

export function showNotification(
    title: string,
    body: string,
    icon?: string
): void {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
        console.warn('[AI Market Insight] Browser does not support notifications');
        return;
    }

    // Request permission if not granted
    if (Notification.permission === 'granted') {
        createNotification(title, body, icon);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                createNotification(title, body, icon);
            }
        });
    }
}

function createNotification(title: string, body: string, icon?: string): void {
    const notification = new Notification(title, {
        body,
        icon: icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📈</text></svg>',
        tag: 'ai-market-insight-signal', // Prevents duplicate notifications
        requireInteraction: false,
        silent: true, // We play our own sound
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Focus window when clicked
    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

/**
 * Combined alert function for trade signals
 */
export function triggerSignalAlert(
    signalType: 'BUY' | 'SELL' | 'HOLD',
    symbol: string,
    confidence: number
): void {
    // Only alert for actionable signals (BUY or SELL)
    if (signalType === 'HOLD') {
        return;
    }

    const emoji = signalType === 'BUY' ? '🟢' : '🔴';
    const action = signalType === 'BUY' ? 'Long Entry' : 'Short Entry';

    // Play sound
    playAlertSound(signalType.toLowerCase() as 'buy' | 'sell');

    // Show notification
    showNotification(
        `${emoji} ${signalType} Signal - ${symbol}`,
        `${action} opportunity detected!\nConfidence: ${confidence}%`
    );
}
