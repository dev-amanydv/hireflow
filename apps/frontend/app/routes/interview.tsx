import { useParams, Link } from "react-router";
import { ArrowLeft, Radio } from "lucide-react";
import type { Route } from "./+types/interview";
import TopNav from "~/components/app/TopNav";
import { useEffect, useRef, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Interview — Sable" }];
}

export default function Interview() {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket>(null)

  useEffect(() => {
    const getMediaDevices = async () => {
      const constraints: MediaStreamConstraints = {
        video: {
          width: 1280,
          height: 720,
        },
        audio: true,
      };
      const openMediaDevices = async (constraints: MediaStreamConstraints) => {
        return await navigator.mediaDevices.getUserMedia(constraints);
      };
      try {
        const stream = await openMediaDevices(constraints);
        if (videoRef.current){
          videoRef.current.srcObject = stream
        }
        console.log("Got MediaStream: ", stream);
        const videoTracks = stream.getVideoTracks();
        console.log("videoTracks: ", videoTracks);

      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    }
    getMediaDevices()
  }, [])

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000")
    wsRef.current = ws

    ws.onopen = () => {
      console.log('connected')
      ws.send(JSON.stringify({ type: "hello" }))
    }
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('received: ', data)
    }
    ws.onerror = (err) =>{
      console.error("WebSocket error:", err)
    }

    return () => {
      ws.close(1000, "component unmounted")
    }
  }, [])
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary">
          <Radio className="size-6 text-ink-subtle" />
        </div>
        <span className="ln-eyebrow mt-6">Interview room</span>
        <h1 className="ln-display-md mt-3 text-foreground">Your session is being set up</h1>
        <video ref={videoRef} autoPlay controls controlsList="nofullscreen nodownload" width={1280} height={720}></video>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-subtle">
          The live interview experience is coming soon. Your profile is ready and this
          session is queued.
        </p>
        <p className="ln-mono mt-4 rounded-full bg-muted px-3 py-1 text-[12px] text-ink-muted">
          {id}
        </p>

        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}
