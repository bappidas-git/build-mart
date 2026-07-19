import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { detectVideoProvider, sanitizeMediaUrl } from "../../services/testimonialsApi";
import styles from "./VideoEmbed.module.css";

// =============================================================================
// VideoEmbed — autoplay-on-view video for testimonial media
// =============================================================================
// Renders a lightweight thumbnail facade first, then auto-activates the real
// player (YouTube/Vimeo/Facebook/Instagram iframe, or a native <video> for
// direct files) once the card scrolls into view — videos start playing on
// every device without a tap. Browsers only allow gesture-less autoplay when
// muted, so auto-activation uses the provider's muted embed; the viewer
// unmutes with the player's own controls. Because nothing loads until the
// frame is actually on screen, Core Web Vitals stay clean even with many
// video testimonials on the page.
//
// The facade stays click-to-play (with sound, since a click is a real
// gesture) for visitors with prefers-reduced-motion or data-saver enabled,
// and in browsers without IntersectionObserver.
//
// Native <video> players additionally pause when scrolled off screen and
// resume when they come back.
//
// Provider detection and embed-URL construction live in testimonialsApi
// (detectVideoProvider): embeds are built from parsed IDs onto fixed provider
// hosts, so a pasted URL can never become an arbitrary iframe src. Unsafe or
// unrecognised URLs render nothing.
//
// Props:
//   url       string   admin-entered video URL (any supported provider)
//   poster    string   optional admin-entered poster/thumbnail URL
//   title     string   accessible name for the play button / iframe
//   showWatchLink  boolean  "Watch on <platform>" new-tab action (default true)
// =============================================================================

// How much of the frame must be visible before the player activates / resumes.
const ACTIVATE_VISIBILITY = 0.5;

const autoplayAllowed = () => {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return false;
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }
  if (navigator.connection && navigator.connection.saveData === true) return false;
  return true;
};

const VideoEmbed = ({ url, poster = "", title = "Customer video testimonial", showWatchLink = true }) => {
  // "" (facade showing) | "auto" (scrolled into view, muted) | "click" (user gesture, sound on)
  const [activated, setActivated] = useState("");
  const [thumbFailed, setThumbFailed] = useState(false);
  const frameRef = useRef(null);
  const playerRef = useRef(null);

  const video = detectVideoProvider(url);
  const videoKey = video ? video.embedUrl : "";

  // Auto-activate the player once the frame is half visible.
  useEffect(() => {
    if (!videoKey || activated || !autoplayAllowed()) return undefined;
    const node = frameRef.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setActivated("auto");
      },
      { threshold: ACTIVATE_VISIBILITY }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [videoKey, activated]);

  // Native <video> only: pause off screen, resume (muted auto mode) on return.
  const kind = video ? video.kind : "";
  useEffect(() => {
    if (kind !== "file" || activated !== "auto") return undefined;
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        const player = playerRef.current;
        if (!player) return;
        if (entry.isIntersecting) {
          const played = player.play();
          if (played && typeof played.catch === "function") played.catch(() => {});
        } else {
          player.pause();
        }
      },
      { threshold: ACTIVATE_VISIBILITY }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [kind, activated]);

  if (!video) return null;

  const posterUrl = sanitizeMediaUrl(poster) || video.thumbnailUrl;
  const muted = activated === "auto";

  return (
    <div className={styles.wrap}>
      <div className={styles.frame} ref={frameRef}>
        {activated ? (
          video.kind === "file" ? (
            <video
              ref={playerRef}
              className={styles.player}
              src={video.embedUrl}
              poster={posterUrl || undefined}
              controls
              autoPlay
              muted={muted}
              playsInline
              preload="metadata"
            >
              Your browser can&rsquo;t play this video.{" "}
              <a href={video.watchUrl} target="_blank" rel="noopener noreferrer">
                Open it directly
              </a>
              .
            </video>
          ) : (
            <iframe
              className={styles.player}
              src={muted ? video.mutedEmbedUrl : video.embedUrl}
              title={title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )
        ) : (
          <button
            type="button"
            className={styles.facade}
            onClick={() => setActivated("click")}
            aria-label={`Play video: ${title}`}
          >
            {posterUrl && !thumbFailed ? (
              <img
                className={styles.thumb}
                src={posterUrl}
                alt=""
                loading="lazy"
                onError={() => setThumbFailed(true)}
              />
            ) : (
              <span className={styles.thumbFallback} aria-hidden="true">
                <Icon icon="mdi:video-outline" />
              </span>
            )}
            <span className={styles.playBadge} aria-hidden="true">
              <Icon icon="mdi:play" />
            </span>
          </button>
        )}
      </div>

      {showWatchLink && video.provider !== "file" && (
        <a
          className={styles.watchLink}
          href={video.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon icon="mdi:open-in-new" aria-hidden="true" />
          Watch on {video.label}
        </a>
      )}
    </div>
  );
};

export default VideoEmbed;
