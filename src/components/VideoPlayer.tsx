import type { VideoHTMLAttributes } from "react";

export type VideoPlayerProps = VideoHTMLAttributes<HTMLVideoElement> & {
  className?: string;
};

export function VideoPlayer({ className = "", ...props }: VideoPlayerProps) {
  return (
    <video
      className={`w-full rounded-2xl bg-black/80 shadow-[0_0_24px_rgba(0,0,0,0.6)] ${className}`}
      controls
      playsInline
      preload="metadata"
      {...props}
    />
  );
}
