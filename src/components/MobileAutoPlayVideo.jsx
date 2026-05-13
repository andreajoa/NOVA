"use client";

import { useEffect, useRef } from "react";

export default function MobileAutoPlayVideo({
  src,
  className = "",
  preload = "metadata",
  pauseWhenOffscreen = false,
  title = "NOVA video",
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let timers = [];

    const forcePlay = () => {
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

    const schedulePlay = () => {
      forcePlay();
      timers.forEach(clearTimeout);
      timers = [
        setTimeout(forcePlay, 250),
        setTimeout(forcePlay, 800),
        setTimeout(forcePlay, 1600),
      ];
    };

    schedulePlay();

    let observer = null;

    if (pauseWhenOffscreen && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            schedulePlay();
          } else {
            video.pause();
          }
        },
        { threshold: 0.12 }
      );

      observer.observe(video);
    }

    const resume = () => {
      if (!document.hidden) schedulePlay();
    };

    video.addEventListener("loadedmetadata", schedulePlay);
    video.addEventListener("loadeddata", schedulePlay);
    video.addEventListener("canplay", schedulePlay);
    video.addEventListener("playing", forcePlay);

    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("touchstart", schedulePlay, { passive: true });
    window.addEventListener("click", schedulePlay, { passive: true });

    return () => {
      timers.forEach(clearTimeout);
      if (observer) observer.disconnect();

      video.removeEventListener("loadedmetadata", schedulePlay);
      video.removeEventListener("loadeddata", schedulePlay);
      video.removeEventListener("canplay", schedulePlay);
      video.removeEventListener("playing", forcePlay);

      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("touchstart", schedulePlay);
      window.removeEventListener("click", schedulePlay);
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
      controls={false}
      disablePictureInPicture
      aria-label={title}
      data-nova-mobile-video="true"
      {...{
        playsinline: "",
        "webkit-playsinline": "",
      }}
    />
  );
}
