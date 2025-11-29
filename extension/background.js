let port = null;
let tabMediaStates = new Map(); // tabId -> {playing, title, artist, etc}

// Connect to native host
function connectNative() {
  try {
    port = browser.runtime.connectNative("per_tab_mpris_bridge");
    
    port.onMessage.addListener((msg) => {
      console.log("Native host response:", msg);
      
      // Handle commands from native host (play/pause/etc)
      if (msg.command && msg.tabId) {
        handleNativeCommand(msg.command, msg.tabId);
      }
    });
    
    port.onDisconnect.addListener(() => {
      console.error("Native host disconnected:", browser.runtime.lastError);
      port = null;
      // Try to reconnect after 5 seconds
      setTimeout(connectNative, 5000);
    });
    
    console.log("✓ Connected to native host");
  } catch (e) {
    console.error("✗ Failed to connect to native host:", e);
    setTimeout(connectNative, 5000);
  }
}

// Send message to native host
function sendToNative(msg) {
  if (port) {
    console.log("→ Sending to native:", msg.type, msg.tabId, msg.playing !== undefined ? (msg.playing ? "Playing" : "Paused") : "");
    port.postMessage(msg);
  } else {
    console.warn("⚠ Not connected to native host, message dropped:", msg);
  }
}

// Handle commands from native host (MPRIS controls)
function handleNativeCommand(command, tabId) {
  console.log(`← Handling command ${command} for tab ${tabId}`);
  
  browser.tabs.sendMessage(tabId, {
    type: "mediaCommand",
    command: command
  }).catch(e => console.error("Failed to send command to tab:", e));
}

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((msg, sender) => {
  if (!sender.tab) return;
  
  const tabId = sender.tab.id;
  
  if (msg.type === "mediaStateUpdate") {
    const status = msg.playing ? "▶️ Playing" : "⏸️ Paused";
    console.log(`📺 Media state from tab ${tabId}: ${status} - ${msg.title || 'Unknown'}`);
    
    // Update our state
    tabMediaStates.set(tabId, {
      playing: msg.playing,
      title: msg.title,
      artist: msg.artist,
      album: msg.album,
      duration: msg.duration,
      position: msg.position,
      url: sender.tab.url,
      tabTitle: sender.tab.title
    });
    
    // Send to native host
    sendToNative({
      type: "mediaState",
      tabId: tabId,
      playing: msg.playing,
      title: msg.title || sender.tab.title || "Unknown",
      artist: msg.artist || "",
      album: msg.album || "",
      duration: msg.duration || 0,
      position: msg.position || 0
    });
  }
});

// Clean up when tabs close
browser.tabs.onRemoved.addListener((tabId) => {
  if (tabMediaStates.has(tabId)) {
    console.log(`🗑️ Tab ${tabId} closed, cleaning up`);
    tabMediaStates.delete(tabId);
    sendToNative({
      type: "tabClosed",
      tabId: tabId
    });
  }
});

// Initialize
console.log("🚀 Firefox MPRIS Bridge extension starting...");
connectNative();
