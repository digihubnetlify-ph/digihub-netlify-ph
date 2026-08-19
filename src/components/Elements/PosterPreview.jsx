import { useEffect, useRef, useState } from "react";
import { toStreamUrl } from "../../services";
import { getEmbedInfo } from "./VideoPlayerModal";

// Netflix-style inline poster preview: shows the static poster image, then
// swaps to a silent, looping trailer preview automatically once the card
// scrolls into view — no click or hover required.
//
// Why lazy (IntersectionObserver) instead of playing immediately: a
// Products/Home grid can have dozens of these on screen at once. Loading
// and decoding that many videos/iframes at once would tank the page and
// burn a lot of the visitor's data for previews they're not even looking
// at. Playback starts only once a card is actually visible, and pauses
// again once it scrolls out.
//
// Why muted: browsers block unmuted autoplay without a user gesture, and a
// mixed autoplay-mutes-fail per-card would look broken and inconsistent —
// so every inline preview is muted by design, same as Netflix/YouTube
// preview treatments.
//
// Not every trailer_url can be reliably autoplayed inline (Google Drive's
// /preview iframe has no muted-autoplay/loop param). Those — and any
// preview that fails to load — just keep showing the static poster
// instead of a broken embed.
//
// Data-conscious by default: many visitors are on prepaid/metered mobile
// data, where auto-loading video previews while scrolling can burn data
// they didn't ask to spend. Where the browser exposes it (Network
// Information API — Chrome/Android; not available on Safari/iOS, which
// falls back to normal autoplay), this skips inline preview when the
// visitor has Data Saver turned on or is on a slow/metered connection
// (2G/3G), and keeps showing the static poster instead. It also reacts
// live if the connection type changes mid-session (e.g. Data Saver
// toggled, or moving from Wi-Fi to mobile data).
function isDataConstrained() {
  const conn =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false; // API unsupported (e.g. Safari) — don't block autoplay
  if (conn.saveData) return true;
  return ["slow-2g", "2g", "3g"].includes(conn.effectiveType);
}

export const PosterPreview = ({
  poster,
  trailerUrl,
  alt,
  imgClassName = "",
  mediaClassName = "",
}) => {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dataConstrained, setDataConstrained] = useState(isDataConstrained);

  useEffect(() => {
    if (!trailerUrl || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [trailerUrl]);

  useEffect(() => {
    const conn =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return;
    const onChange = () => setDataConstrained(isDataConstrained());
    conn.addEventListener("change", onChange);
    return () => conn.removeEventListener("change", onChange);
  }, []);

  const embed = trailerUrl ? getEmbedInfo(toStreamUrl(trailerUrl)) : { type: "none" };
  const canPreviewInline =
    embed.type === "video" || embed.provider === "youtube" || embed.provider === "vimeo";
  const showPreview = inView && canPreviewInline && !failed && !dataConstrained;

  // Muted + looping variants of the embed URL (the modal's `embed.src`
  // is built for a deliberate, unmuted, one-shot click-to-watch — not
  // what an always-on background preview should sound/behave like).
  let previewSrc = null;
  if (embed.provider === "youtube") {
    previewSrc =
      `https://www.youtube.com/embed/${embed.id}` +
      `?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0` +
      `&loop=1&playlist=${embed.id}`;
  } else if (embed.provider === "vimeo") {
    previewSrc = `https://player.vimeo.com/video/${embed.id}?autoplay=1&muted=1&loop=1&background=1`;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <img
        src={poster}
        alt={alt}
        className={imgClassName}
        style={showPreview ? { opacity: 0 } : undefined}
      />

      {showPreview && embed.type === "video" && (
        <video
          key={embed.src}
          src={embed.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className={`absolute inset-0 ${mediaClassName}`}
        />
      )}

      {showPreview && previewSrc && (
        <iframe
          key={previewSrc}
          src={previewSrc}
          allow="autoplay; fullscreen"
          tabIndex={-1}
          className={`absolute inset-0 pointer-events-none ${mediaClassName}`}
        />
      )}
    </div>
  );
};
