import React, { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
}

/**
 * Parses any video URL (YouTube raw/watch/shorts/embed, Google Drive, Vimeo, direct MP4)
 * and returns the optimal embed/streaming URL.
 */
export const getCleanVideoEmbedUrl = (rawUrl: string): { embedUrl: string; isYouTube: boolean; isIframe: boolean; videoId?: string; originalUrl: string } => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { embedUrl: '', isYouTube: false, isIframe: false, originalUrl: '' };
  }

  let url = rawUrl.trim();
  const originalUrl = url;

  // If user pasted an iframe tag (e.g. copied from YouTube "Share -> Embed")
  if (url.includes('<iframe') && url.includes('src=')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1];
    }
  }

  // 1. YouTube patterns:
  // - youtube.com/watch?v=ID
  // - youtube.com/embed/ID
  // - youtube.com/v/ID
  // - youtube.com/shorts/ID
  // - youtube.com/live/ID
  // - youtu.be/ID
  // - youtube-nocookie.com/embed/ID
  const ytRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
  const match = url.match(ytRegex);

  if (match && match[1]) {
    const videoId = match[1];
    
    // Check for start timestamp (t=120 or t=2m15s or start=120)
    let startSeconds = 0;
    const timeMatch = url.match(/[?&](?:t|start)=([0-9hms]+)/i);
    if (timeMatch && timeMatch[1]) {
      const tVal = timeMatch[1];
      if (/^\d+$/.test(tVal)) {
        startSeconds = parseInt(tVal, 10);
      } else {
        const h = tVal.match(/(\d+)h/i);
        const m = tVal.match(/(\d+)m/i);
        const s = tVal.match(/(\d+)s/i);
        if (h) startSeconds += parseInt(h[1], 10) * 3600;
        if (m) startSeconds += parseInt(m[1], 10) * 60;
        if (s) startSeconds += parseInt(s[1], 10);
      }
    }

    const startParam = startSeconds > 0 ? `&start=${startSeconds}` : '';
    // YouTube embed URL with clean playback parameters
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1${startParam}`;
    return {
      embedUrl,
      isYouTube: true,
      isIframe: true,
      videoId,
      originalUrl
    };
  }

  // If user pasted a bare 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${url}?rel=0&modestbranding=1&enablejsapi=1`,
      isYouTube: true,
      isIframe: true,
      videoId: url,
      originalUrl
    };
  }

  // 2. Google Drive video link
  if (url.includes('drive.google.com')) {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/i) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        isYouTube: false,
        isIframe: true,
        videoId: fileId,
        originalUrl
      };
    }
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      isYouTube: false,
      isIframe: true,
      videoId: vimeoMatch[1],
      originalUrl
    };
  }

  // 4. Default / direct link
  const isEmbed = url.includes('embed') || url.includes('/preview');
  return {
    embedUrl: url,
    isYouTube: url.includes('youtube.com') || url.includes('youtu.be'),
    isIframe: isEmbed || url.includes('youtube.com') || url.includes('youtu.be'),
    originalUrl
  };
};

/**
 * A clean, robust video player component that automatically transforms any raw YouTube link,
 * watch link, shorts link, Google Drive link, or direct video file into an interactive playable stream.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const [hasError, setHasError] = useState(false);
  const parsed = getCleanVideoEmbedUrl(url);

  if (!parsed.embedUrl) {
    return null;
  }

  if (parsed.isIframe) {
    return (
      <div className="space-y-2 max-w-2xl mx-auto w-full">
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white/20 relative group">
          <iframe 
            src={parsed.embedUrl}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            title={title || "Video Pembelajaran"}
            onError={() => setHasError(true)}
          />
        </div>

        {/* Fallback & Direct Link Bar */}
        {parsed.isYouTube && (
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Play size={12} className="text-red-500 fill-red-500" />
              <span>Video Pembelajaran YouTube</span>
            </span>
            <a
              href={parsed.videoId ? `https://www.youtube.com/watch?v=${parsed.videoId}` : (parsed.originalUrl || parsed.embedUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
            >
              <span>Buka di YouTube</span>
              <ExternalLink size={11} />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aspect-video w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white/20 relative group">
      <video 
        src={parsed.embedUrl}
        className="w-full h-full object-contain"
        controls
        controlsList="nodownload"
        onError={() => setHasError(true)}
      >
        Browser Anda tidak mendukung pemutaran tag video langsung.
      </video>
    </div>
  );
};

