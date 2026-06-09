const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// Trusted fitness channels (channel IDs)
const TRUSTED_CHANNELS = [
  'UCVQJZE_on7It_pEv5liwV2w', // Calisthenicmovement
  'UCaBqRxHEMomgFwmkIVFDGhg', // Athlean-X
  'UCe0TLA0EsQbE-MjuHXevran', // Jeff Nippard
  'UCERm5yFZ1SptUEU4wZ2vJvw', // FitnessFAQs
];

// In-memory cache so the same exercise isn't fetched twice in one session
const videoCache = {};

export async function getYouTubeVideo(exerciseName) {
  if (!YT_API_KEY) {
    console.warn('No YouTube API key set');
    return null;
  }

  // Return cached result if available
  const cacheKey = exerciseName.toLowerCase().trim();
  if (videoCache[cacheKey] !== undefined) {
    return videoCache[cacheKey];
  }

  try {
    const q = encodeURIComponent(`${exerciseName} exercise tutorial proper form`);

    // NOTE: videoCategoryId=17 (Sports) removed — most fitness tutorials are
    // categorised as Education or People & Blogs, so the filter caused empty results.
    const url = [
      'https://www.googleapis.com/youtube/v3/search',
      '?part=snippet',
      `&q=${q}`,
      '&type=video',
      '&maxResults=8',
      '&relevanceLanguage=en',
      '&safeSearch=strict',
      `&key=${YT_API_KEY}`,
    ].join('');

    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      console.error('YouTube API error:', res.status, errText);
      videoCache[cacheKey] = null;
      return null;
    }

    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      videoCache[cacheKey] = null;
      return null;
    }

    // Prefer trusted channels, otherwise take first result
    const trusted = items.find(item =>
      TRUSTED_CHANNELS.includes(item.snippet?.channelId)
    );

    const video = trusted || items[0];
    const videoId = video?.id?.videoId || null;

    videoCache[cacheKey] = videoId;
    return videoId;
  } catch (e) {
    console.error('YouTube fetch error:', e);
    videoCache[cacheKey] = null;
    return null;
  }
}
