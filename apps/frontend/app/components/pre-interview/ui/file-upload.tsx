import { useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import {
  CheckCircle2,
  FileText,
  Loader2,
  RotateCw,
  Sparkles,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { BACKEND_URL } from "~/lib/config";

export type UploadStatus = "uploading" | "complete" | "failed";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  ext: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  retryable?: boolean;
}

export interface CompletedFile {
  name: string;
  size: string;
  ext: string;
}

const DEFAULT_ACCEPT = ".pdf,.doc,.docx";
const DEFAULT_MAX_MB = 5;

const BADGE_COLORS: Record<string, string> = {
  pdf: "bg-red-500",
  doc: "bg-blue-500",
  docx: "bg-blue-500",
  jpg: "bg-violet-500",
  jpeg: "bg-violet-500",
  png: "bg-violet-500",
  gif: "bg-violet-500",
  svg: "bg-violet-500",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extOf(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "file";
}

function FileBadge({ ext }: { ext: string }) {
  return (
    <div className="relative flex size-11 shrink-0 items-center justify-center">
      <svg viewBox="0 0 40 48" className="absolute inset-0 size-full text-muted-foreground/35" fill="none">
        <path
          d="M6 3a3 3 0 0 1 3-3h17l11 11v34a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V3Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M26 0v8a3 3 0 0 0 3 3h8" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span
        className={cn(
          "absolute bottom-2 left-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white",
          BADGE_COLORS[ext] ?? "bg-foreground"
        )}
      >
        {ext.slice(0, 4)}
      </span>
    </div>
  );
}

function StatusLine({ item }: { item: UploadItem }) {
  if (item.status === "uploading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <UploadCloud className="size-4 animate-pulse" />
        Uploading…
      </span>
    );
  }
  if (item.status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
        <CheckCircle2 className="size-4" />
        Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
      <XCircle className="size-4" />
      {item.error ?? "Failed"}
    </span>
  );
}

function FileRow({
  item,
  onRemove,
  onRetry,
}: {
  item: UploadItem;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const failed = item.status === "failed";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 transition-colors",
        failed ? "border-destructive/70" : "border-border"
      )}
    >
      <div className="flex items-start gap-3.5">
        <FileBadge ext={item.ext} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="Remove file"
              className="shrink-0 text-muted-foreground/70 transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4.5" />
            </button>
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted-foreground">
            <span>{formatSize(item.size)}</span>
            <span className="text-border">|</span>
            <StatusLine item={item} />
          </div>

          {failed ? (
            item.retryable && (
              <button
                type="button"
                onClick={() => onRetry(item.id)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-destructive hover:underline"
              >
                <RotateCw className="size-3.5" />
                Try again
              </button>
            )
          ) : (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    item.status === "complete" ? "bg-emerald-500" : "bg-foreground"
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                {Math.round(item.progress)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface SampleResume {
  url: string;
  fileName: string;
  label?: string;
}

export function InputFile({
  interviewId,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_MB,
  multiple = false,
  hint = "PDF, DOC or DOCX (max. 10MB)",
  onComplete,
  uploadUrl = `${BACKEND_URL}/interview/pre/resume`,
  requireInterviewId = true,
  onUploaded,
  onRemoved,
  onUploadError,
  forbiddenMessage,
  sampleResume,
  className,
  dropzoneClassName,
}: {
  interviewId?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  hint?: string;
  onComplete?: (file: CompletedFile) => void;
  uploadUrl?: string;
  requireInterviewId?: boolean;
  onUploaded?: (data: unknown) => void;
  onRemoved?: () => void;
  onUploadError?: (info: { status?: number; message?: string }) => void;
  forbiddenMessage?: string;
  sampleResume?: SampleResume;
  className?: string;
  dropzoneClassName?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<UploadItem | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rawFile = useRef<File | null>(null);
  const interviewIdRef = useRef<string | null>(null);

  function validateFile(file: File) {
    const validSize = file.size < maxSizeMB * 1024 * 1024;
    if (!validSize) return "tooBig";
    const format = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const valid = accept.split(",").map((ext) => ext.trim().toLowerCase()).includes("." + format);
    if (!valid) return "invalidFormat";
    return "valid";
  }

  const uploadResume = async (id: string, selectedFile: File, interviewId?: string) => {
    const form = new FormData();
    form.append("resume", selectedFile);
    if (interviewId) form.append("interviewId", interviewId);

    try {
      const res = await axios.post(uploadUrl, form, {
        withCredentials: true,
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          setFile((prev) =>
            prev && prev.id === id && prev.status === "uploading"
              ? { ...prev, progress: Math.min(pct, 99) }
              : prev
          );
        },
      });
      setFile((prev) =>
        prev && prev.id === id ? { ...prev, progress: 100, status: "complete" } : prev
      );
      onComplete?.({ name: selectedFile.name, size: formatSize(selectedFile.size), ext: extOf(selectedFile.name) });
      onUploaded?.(res.data?.data);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      const forbidden = status === 403;
      onUploadError?.({ status, message });
      setFile((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status: "failed",
              error: forbidden ? (forbiddenMessage ?? "Not allowed") : "Upload failed",
              retryable: !forbidden,
            }
          : prev
      );
    }
  };

  const addFile = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    const val = validateFile(selectedFile);
    const id = crypto.randomUUID();

    if (val !== "valid") {
      setFile({
        id,
        name: selectedFile.name,
        size: selectedFile.size,
        ext: extOf(selectedFile.name),
        progress: 0,
        status: "failed",
        error: val === "tooBig" ? `Too large (max ${maxSizeMB}MB)` : "Unsupported type",
        retryable: false,
      });
      rawFile.current = null;
      return;
    }

    if (requireInterviewId && !interviewId) return;
    interviewIdRef.current = interviewId ?? null;

    setFile({
      id,
      name: selectedFile.name,
      size: selectedFile.size,
      ext: extOf(selectedFile.name),
      progress: 0,
      status: "uploading",
      retryable: false,
    });
    rawFile.current = selectedFile;
    uploadResume(id, selectedFile, interviewId);
  };

  const handleRemove = () => {
    rawFile.current = null;
    setFile(null);
    onRemoved?.();
  };
  
  const handleRetry = async () => {
    const selectedFile = rawFile.current;
    if (!selectedFile || !file) return;
    if (requireInterviewId && !interviewId) return;
    interviewIdRef.current = interviewId ?? null;
    setFile({ ...file, status: "uploading", progress: 0, error: undefined });
    uploadResume(file.id, selectedFile, interviewId);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const openPicker = () => inputRef.current?.click();

  const loadSample = async () => {
    if (!sampleResume || sampleLoading) return;
    setSampleLoading(true);
    try {
      const res = await fetch(sampleResume.url);
      if (!res.ok) throw new Error("Failed to fetch sample resume");
      const blob = await res.blob();
      const sampleFile = new File([blob], sampleResume.fileName, {
        type: blob.type || "application/pdf",
      });
      await addFile(sampleFile);
    } catch {
      toast.error("Couldn't load the sample resume. Please try again.");
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onClick={() => openPicker()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center transition-colors outline-none",
          dragging
            ? "border-foreground bg-muted/60"
            : "border-border bg-card hover:border-foreground/40 hover:bg-muted/40 focus-visible:border-foreground/40",
          dropzoneClassName
        )}
      >
        <div className="flex size-11 items-center justify-center rounded-lg border bg-background">
          <UploadCloud className="size-5 text-foreground/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
          <input
            type="file"
            ref={inputRef}
            onChange={(e) => handleFileChange(e)}
            accept={accept}
            multiple={multiple}
            className="hidden"
          />
      </div>

      {!file && sampleResume && (
        <button
          type="button"
          onClick={loadSample}
          disabled={sampleLoading}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-border/70 border-dashed bg-muted/20 px-4 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40 disabled:cursor-wait disabled:opacity-70"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground/70">
              {sampleLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {sampleResume.label ?? "Don't have a resume handy?"}
              </p>
              <p className="text-xs text-muted-foreground">Use our sample PDF to try this out</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground underline underline-offset-2 group-hover:no-underline">
            <Sparkles className="size-3.5" />
            {sampleLoading ? "Loading…" : "Use sample"}
          </span>
        </button>
      )}

      {file && (
        <div className="flex flex-col gap-3">
            <FileRow key={file.id} item={file} onRemove={handleRemove} onRetry={handleRetry} />
        </div>
      )}
    </div>
  );
}

export { InputFile as FileUpload };
