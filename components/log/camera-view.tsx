"use client";

import { Camera, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "starting" | "live" | "unavailable";

/**
 * A live camera with a scan frame, like the reference app. If the browser blocks the camera (or it
 * is not available), it falls back to the phone's own photo picker, which always works.
 */
export function CameraView({
  onPhoto,
  onClose,
  message,
}: {
  onPhoto: (photo: Blob) => void;
  onClose: () => void;
  message?: string | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const takeInput = useRef<HTMLInputElement>(null);
  const pickInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  // If the camera has not started after a few seconds, offer the phone's own camera instead.
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const element = video.current;
        if (element) {
          element.srcObject = stream;
          await element.play().catch(() => undefined);
        }
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    }

    void start();
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    return () => {
      clearTimeout(slowTimer);
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const element = video.current;
    if (!element || !element.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    canvas.getContext("2d")?.drawImage(element, 0, 0);
    canvas.toBlob((blob) => blob && onPhoto(blob), "image/jpeg", 0.92);
  }

  function chosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPhoto(file);
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white">
      <input ref={takeInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={chosen} aria-hidden tabIndex={-1} />
      <input ref={pickInput} type="file" accept="image/*" className="hidden" onChange={chosen} aria-hidden tabIndex={-1} />

      <div className="flex items-center justify-between px-5 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} aria-label="Close camera" className="flex size-11 items-center justify-center rounded-full bg-white/15 active:bg-white/25">
          <X className="size-6" aria-hidden />
        </button>
        <span className="text-sm font-semibold">Scan food</span>
        <span className="size-11" aria-hidden />
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={video} playsInline muted autoPlay className="absolute inset-0 size-full object-cover" />

        {status === "live" ? (
          <div className="pointer-events-none relative aspect-square w-[78%] max-w-sm" aria-hidden>
            {["left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl"].map((c) => (
              <span key={c} className={`absolute size-12 border-white ${c}`} />
            ))}
          </div>
        ) : null}

        {status === "unavailable" ? (
          <div className="relative flex max-w-xs flex-col items-center gap-4 px-6 text-center">
            <Camera className="size-12 opacity-80" aria-hidden />
            <p className="text-lg font-semibold">Live camera isn&apos;t available</p>
            <p className="text-sm text-white/70">You can still take a photo with your phone&apos;s camera or pick one from your gallery.</p>
            <Button size="lg" className="h-12 w-full rounded-full bg-white text-black hover:bg-white/90" onClick={() => takeInput.current?.click()}>
              Take a photo
            </Button>
          </div>
        ) : null}

        {status === "starting" ? (
          <div className="relative flex max-w-xs flex-col items-center gap-4 px-6 text-center">
            <p className="text-sm text-white/80">Starting the camera…</p>
            {slow ? (
              <>
                <p className="text-sm text-white/70">Taking a while? You may need to allow camera access.</p>
                <Button size="lg" className="h-12 w-full rounded-full bg-white text-black hover:bg-white/90" onClick={() => takeInput.current?.click()}>
                  Use my phone&apos;s camera
                </Button>
              </>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p className="absolute inset-x-5 top-4 rounded-2xl bg-black/70 p-3 text-center text-sm" role="alert">
            {message}
          </p>
        ) : null}
      </div>

      <div className="px-8 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {status === "live" ? <p className="mb-3 text-center text-xs text-white/80">Keep the food inside the frame and hold still.</p> : null}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => pickInput.current?.click()} aria-label="Choose from gallery" className="flex size-14 items-center justify-center rounded-2xl bg-white/15 active:bg-white/25">
            <ImageIcon className="size-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={status !== "live"}
            aria-label="Take photo"
            className="flex size-[76px] items-center justify-center rounded-full border-4 border-white p-1 disabled:opacity-40"
          >
            <span className="size-full rounded-full bg-white active:scale-95" />
          </button>
          <span className="size-14" aria-hidden />
        </div>
      </div>
    </div>
  );
}
