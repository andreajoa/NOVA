"use client";

import { useEffect, useRef } from "react";

export default function MobileAutoPlayVideo({
  src,
  className = "",
  preload = "metadata",
  pauseWhenOffscreen = false,
  poster,
  title,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prepareVideo = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;

      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("loop", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("disablepictureinpicture", "");

      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    };

    prepareVideo();

    let observer;

    if (pauseWhenOffscreen && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            prepareVideo();
          } else {
            video.pause();
          }
        },
        { threshold: 0.18 }
      );

      observer.observe(video);
    }

    const handleResume = () => {
      if (!document.hidden) prepareVideo();
    };

    window.addEventListener("pageshow", handleResume);
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("touchstart", prepareVideo, {
      once: true,
      passive: true,
    });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("pageshow", handleResume);
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("touchstart", prepareVideo);
    };
  }, [src, pauseWhenOffscreen]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      autoPlay
      muted
      defaultMuted
      loop
      playsInline
      preload={preload}
      poster={poster}
      aria-label={title}
      controls={false}
      disablePictureInPicture
    />
  );
}
