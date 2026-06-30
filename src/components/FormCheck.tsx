import { useRef, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

type CoachReply = {
    videoSrc: string;
    audioSrc: string;
    thumbnail: string;
    note: string;
    receivedAt: string;
};

type FormCheckProps = {
    coachName: string;
    coachRole: string;
    coachAvatar: string;
    reply: CoachReply;
};

export default function FormCheck({ coachName, coachRole, coachAvatar, reply }: FormCheckProps) {
    const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'captured'>('idle');
    const [preview, setPreview] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleCapture = async () => {
        setCaptureStatus('capturing');
        try {
            const photo = await Camera.getPhoto({
                quality: 90,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera,
            });
            setPreview(photo.webPath ?? null);
            setCaptureStatus('captured');
        } catch {
            setCaptureStatus('idle');
        }
    };

    const togglePlayback = async () => {
        const nextState = !isPlaying;
        setIsPlaying(nextState);

        if (!videoRef.current || !audioRef.current) return;

        if (nextState) {
            await Promise.allSettled([videoRef.current.play(), audioRef.current.play()]);
        } else {
            videoRef.current.pause();
            audioRef.current.pause();
        }
    };

    return (
        <div className="flex flex-col items-end gap-4">
            <button
                onClick={handleCapture}
                className="flex items-center gap-3 rounded-full bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00D1FF]/20 text-[#00D1FF]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                        <path d="M4 7h3l2-2h6l2 2h3v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </span>
                <div className="text-left">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Form Check</p>
                    <p className="text-sm">{captureStatus === 'captured' ? 'Set captured' : 'Record your set'}</p>
                </div>
            </button>

            {preview && (
                <div className="w-64 rounded-3xl bg-white/5 p-4 text-xs text-gray-400 backdrop-blur-2xl">
                    <p className="text-white">Your clip is queued for coaching review.</p>
                    <p className="mt-2">We’ll notify you as soon as feedback is ready.</p>
                </div>
            )}

            <button
                onClick={togglePlayback}
                className="w-72 overflow-hidden rounded-[28px] bg-gray-900/95 p-4 text-left text-white shadow-[0_30px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={coachAvatar} alt={coachName} className="h-12 w-12 rounded-full object-cover" />
                        <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.8)]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{coachName}</p>
                        <p className="text-xs text-gray-400">{coachRole}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Unread</span>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl bg-white/5">
                    <video
                        ref={videoRef}
                        poster={reply.thumbnail}
                        src={reply.videoSrc}
                        className="h-40 w-full object-cover"
                        playsInline
                    />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>{reply.receivedAt}</span>
                    <span>{isPlaying ? 'Playing correction' : 'Tap to play correction'}</span>
                </div>

                <p className="mt-3 text-sm text-white">{reply.note}</p>

                <audio ref={audioRef} src={reply.audioSrc} preload="metadata" />
            </button>
        </div>
    );
}
