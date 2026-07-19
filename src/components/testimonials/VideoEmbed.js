import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { detectVideoProvider, sanitizeMediaUrl } from "../../services/testimonialsApi";
import styles from "./VideoEmbed.module.css";

// =============================================================================
// VideoEmbed — click-to-load video facade for testimonial media
// =============================================================================
// Renders a lightweight thumbnail + play button and defers the real player
// (YouTube/Vimeo/Facebook/Instagram iframe, or a native <video> for direct
// files) until the visitor actually clicks — no third-party JS or video bytes
// load with the page, which keeps Core Web Vitals clean even with many video
// testimonials on screen.
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
const VideoEmbed = ({ url, poster = "", title = "Customer video testimonial", showWatchLink = true }) => {
  const [activated, setActivated] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const video = detectVideoProvider(url);
  if (!video) return null;

  const posterUrl = sanitizeMediaUrl(poster) || video.thumbnailUrl;

  return (
    <div className={styles.wrap}>
      <div className={styles.frame}>
        {activated ? (
          video.kind === "file" ? (
            <video
              className={styles.player}
              src={video.embedUrl}
              poster={posterUrl || undefined}
              controls
              autoPlay
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
              src={video.embedUrl}
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
            onClick={() => setActivated(true)}
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
