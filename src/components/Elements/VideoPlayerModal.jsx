import { useState } from "react";

// Shared full-screen video modal. `nowPlaying` is either null (closed) or
// { name, url }. Used for the Dashboard's "Watch Now", and ProductDetail's
// "Preview" / "Watch Online" — one implementation, one place to fix bugs.
//
// trailer_url / download_url in the database can be a YouTube link, a Vimeo
// link, a Google Drive share link, or a direct video file (Cloudinary,
// Bunny, R2, etc). Each of those needs a different kind of player, so this
// figures out which one it's looking at and renders the right thing —
// instead of assuming every link is a direct file.
function getEmbedInfo(url) {
  if (!url) return { type: "none" };

  // youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, with or
  // without extra query params (list=, t=, si=, etc.)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (ytMatch) {
    // cc_load_policy=1 turns captions ON by default when the video loads,
    // instead of leaving them off until someone manually clicks the CC
    // button. Only works if the video actually HAS captions on YouTube's
    // side — this can't create captions that don't exist for a video.
    return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&cc_load_policy=1` };
  }

  // vimeo.com/12345678
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    // Vimeo turns on captions by default already (texttrack param only
    // needed to force a SPECIFIC language track) — no extra param needed here.
    return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };
  }

  // Google Drive share link — needs its own embeddable /preview URL, a raw
  // <video> tag can't play a Drive share link at all. Drive's own player
  // shows a CC button automatically if the uploaded file has an attached
  // caption track (added via Drive's own "Manage subtitles" option) — no
  // embed URL parameter can force this on, so there's nothing to add here.
  if (url.includes("drive.google.com")) {
    const idMatch = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
    const driveId = idMatch ? idMatch[1] : null;
    return {
      type: "iframe",
      src: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : url,
    };
  }

  // Anything else is assumed to be a direct, playable video file URL.
  return { type: "video", src: url };
}

export const VideoPlayerModal = ({ nowPlaying, onClose }) => {
  const [videoError, setVideoError] = useState(false);

  if (!nowPlaying) return null;

  const embed = getEmbedInfo(nowPlaying.url);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <p className="text-white text-sm truncate pr-4">{nowPlaying.name}</p>
          <button
            onClick={onClose}
            aria-label="Close player"
            className="text-white text-2xl leading-none px-2 hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        {embed.type === "iframe" && (
          <iframe
            key={embed.src}
            src={embed.src}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full aspect-video rounded-lg bg-black"
          />
        )}

        {embed.type === "video" && !videoError && (
          <video
            key={embed.src}
            src={embed.src}
            controls
            autoPlay
            onError={() => setVideoError(true)}
            className="w-full aspect-video max-h-[80vh] rounded-lg bg-black"
          >
            {/* Optional subtitle track — only appears if a .vtt caption file
                is set on this item (nowPlaying.subtitleUrl). No effect for
                items without one; nothing breaks if it's absent. */}
            {nowPlaying.subtitleUrl && (
              <track
                src={nowPlaying.subtitleUrl}
                kind="subtitles"
                srcLang="en"
                label="English"
                default
              />
            )}
            Your browser doesn't support video playback.
          </video>
        )}

        {(embed.type === "none" || (embed.type === "video" && videoError)) && (
          <div className="w-full aspect-video rounded-lg bg-black flex flex-col items-center justify-center gap-3 text-center px-4">
            <p className="text-white text-sm">
              {embed.type === "none"
                ? "No video link is set for this item."
                : "This video couldn't be played — the link isn't a direct playable video file."}
            </p>
            {nowPlaying.url && (
              <a
                href={nowPlaying.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 text-sm underline"
              >
                Open the link directly
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
