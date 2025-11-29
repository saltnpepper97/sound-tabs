let mediaElements = [];
let lastState = null;

// Find all media elements on the page
function findMediaElements() {
  return Array.from(document.querySelectorAll('audio, video'));
}

// Extract metadata from page
function getMetadata() {
  let title = document.title;
  let artist = "";
  let album = "";
  
  // Try to extract from common meta tags
  const metaTitle = document.querySelector('meta[property="og:title"]') ||
                    document.querySelector('meta[name="title"]');
  if (metaTitle) title = metaTitle.content;
  
  const metaArtist = document.querySelector('meta[property="og:artist"]') ||
                     document.querySelector('meta[name="artist"]');
  if (metaArtist) artist = metaArtist.content;
  
  // YouTube specific
  if (window.location.hostname.includes('youtube.com')) {
    const ytTitle = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title');
    if (ytTitle) title = ytTitle.textContent.trim();
    
    const ytChannel = document.querySelector('ytd-channel-name a, #owner-name a');
    if (ytChannel) artist = ytChannel.textContent.trim();
  }
  
  return { title, artist, album };
}

// Get current playback state
function getPlaybackState() {
  const media = mediaElements[0]; // Use first media element
  if (!media) return null;
  
  const metadata = getMetadata();
  
  return {
    playing: !media.paused,
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    duration: media.duration || 0,
    position: media.currentTime || 0,
    volume: media.volume,
    muted: media.muted
  };
}

// Send state update to background
function sendStateUpdate() {
  const state = getPlaybackState();
  if (!state) return;
  
  // Create a comparison object without position (which changes constantly)
  const stateWithoutPosition = { ...state };
  delete stateWithoutPosition.position;
  
  const lastStateWithoutPosition = lastState ? { ...lastState } : null;
  if (lastStateWithoutPosition) {
    delete lastStateWithoutPosition.position;
  }
  
  // Only send if meaningful state changed (not just position)
  const stateChanged = JSON.stringify(stateWithoutPosition) !== JSON.stringify(lastStateWithoutPosition);
  
  if (stateChanged || !lastState) {
    console.log("State update:", state.playing ? "Playing" : "Paused", state.title);
    lastState = state;
    browser.runtime.sendMessage({
      type: "mediaStateUpdate",
      ...state
    }).catch(e => console.error("Failed to send state update:", e));
  }
}

// Handle media element events
function setupMediaElement(element) {
  const events = ['play', 'pause', 'ended', 'timeupdate', 'durationchange', 'volumechange'];
  
  events.forEach(eventName => {
    element.addEventListener(eventName, () => {
      sendStateUpdate();
    });
  });
}

// Handle commands from background script
browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === "mediaCommand") {
    const media = mediaElements[0];
    if (!media) return;
    
    switch (msg.command) {
      case "play":
        media.play().catch(e => console.error("Play failed:", e));
        break;
      case "pause":
        media.pause();
        break;
      case "playPause":
        if (media.paused) {
          media.play().catch(e => console.error("Play failed:", e));
        } else {
          media.pause();
        }
        break;
      case "stop":
        media.pause();
        media.currentTime = 0;
        break;
      case "next":
        // Try to find and click next button (YouTube specific)
        const nextBtn = document.querySelector('.ytp-next-button');
        if (nextBtn) nextBtn.click();
        break;
      case "previous":
        // Try to find and click previous button
        const prevBtn = document.querySelector('.ytp-prev-button');
        if (prevBtn) prevBtn.click();
        break;
      case "seek":
        if (msg.position !== undefined) {
          media.currentTime = msg.position;
        }
        break;
    }
  }
});

// Monitor for new media elements
function monitorMedia() {
  const newElements = findMediaElements();
  
  newElements.forEach(element => {
    if (!mediaElements.includes(element)) {
      mediaElements.push(element);
      setupMediaElement(element);
      console.log("Found media element:", element);
      sendStateUpdate(); // Send immediately when new media found
    }
  });
  
  // Remove elements that no longer exist
  mediaElements = mediaElements.filter(el => document.contains(el));
}

// Periodic position updates (only when playing)
function periodicUpdate() {
  if (mediaElements.length > 0) {
    const media = mediaElements[0];
    if (media && !media.paused) {
      // Only send position updates every 5 seconds while playing
      sendStateUpdate();
    }
  }
}

// Start monitoring
monitorMedia();
setInterval(monitorMedia, 3000); // Check for new media every 3 seconds
setInterval(periodicUpdate, 5000); // Update position every 5 seconds while playing

// Send initial state after page load
setTimeout(() => {
  monitorMedia();
  sendStateUpdate();
}, 2000);
