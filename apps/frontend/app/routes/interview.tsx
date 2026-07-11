import { useParams, Link } from "react-router";
import { ArrowLeft, Radio, Phone } from "lucide-react";
import type { Route } from "./+types/interview";
import TopNav from "~/components/app/TopNav";
import { useEffect, useRef } from "react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Interview — Sable" }];
}

export default function Interview() {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket>(null);
  const pcRef = useRef<RTCPeerConnection>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("connected");
      ws.send(JSON.stringify({ type: "hello" }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("received: ", data);
    };
    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close(1000, "component unmounted");
    };
  }, []);

  useEffect(() => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;
    const constraints: MediaStreamConstraints = {
      video: {
        width: 1280,
        height: 720,
      },
      audio: true,
    };
    pc.ontrack = (event) => {
      if (!remoteVideoRef.current) return null;
      remoteVideoRef.current.srcObject = event.streams[0];
    };
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    setupMedia();
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const ws = wsRef.current;
      if (!ws) return;
      const payload = JSON.stringify({
        type: "candidate",
        candidate: event.candidate,
      });
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      } else {
        ws.addEventListener("open", () => ws.send(payload), { once: true });
      }
    };
    if (!wsRef.current) return;
    wsRef.current.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsRef.current?.send(JSON.stringify({ type: "answer", answer: answer }));
      } else if (data.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === "candidate") {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    return () => {
      pc.close();
      wsRef.current?.close();
    };
  }, []);

  const call = async () => {
    const pc = pcRef.current;
    const ws = wsRef.current;
    if (!pc || !ws || ws.readyState !== WebSocket.OPEN) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: "offer", offer }));
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary">
          <Radio className="size-6 text-ink-subtle" />
        </div>
        <span className="ln-eyebrow mt-6">Interview room</span>
        <h1 className="ln-display-md mt-3 text-foreground">
          Your session is being set up
        </h1>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          controls
          controlsList="nofullscreen nodownload"
          width={1280}
          height={720}
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          controls
          controlsList="nofullscreen nodownload"
          width={1280}
          height={720}
        ></video>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-subtle">
          The live interview experience is coming soon. Your profile is ready
          and this session is queued.
        </p>
        <p className="ln-mono mt-4 rounded-full bg-muted px-3 py-1 text-[12px] text-ink-muted">
          {id}
        </p>

        <button
          onClick={call}
          className="mt-8 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Phone className="size-4" />
          Start call
        </button>

        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}
