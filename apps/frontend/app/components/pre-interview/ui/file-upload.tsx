import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  RotateCw,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { cn } from "~/lib/utils";

export type UploadStatus = "uploading" | "complete" | "failed";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  ext: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface CompletedFile {
  name: string;
  size: string;
  ext: string;
}

const DEFAULT_ACCEPT = ".pdf,.doc,.docx";
const DEFAULT_MAX_MB = 10;

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
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-destructive hover:underline"
            >
              <RotateCw className="size-3.5" />
              Try again
            </button>
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

export function InputFile({
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_MB,
  multiple = false,
  hint = "PDF, DOC or DOCX (max. 10MB)",
  onComplete,
}: {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  hint?: string;
  onComplete?: (file: CompletedFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearInterval);
    };
  }, []);

  const stopTimer = (id: string) => {
    const t = timers.current[id];
    if (t) {
      clearInterval(t);
      delete timers.current[id];
    }
  };

  const runUpload = useCallback(
    (id: string) => {
      stopTimer(id);
      timers.current[id] = setInterval(() => {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id || it.status !== "uploading") return it;
            const next = Math.min(it.progress + Math.random() * 16 + 8, 100);
            if (next >= 100) {
              stopTimer(id);
              onComplete?.({ name: it.name, size: formatSize(it.size), ext: it.ext });
              return { ...it, progress: 100, status: "complete" };
            }
            return { ...it, progress: next };
          })
        );
      }, 280);
    },
    [onComplete]
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const incoming = multiple ? Array.from(fileList) : [fileList[0]];
      const accepted = accept.split(",").map((a) => a.trim().toLowerCase());

      const newItems: UploadItem[] = incoming.map((file) => {
        const ext = extOf(file.name);
        const tooBig = file.size > maxSizeMB * 1024 * 1024;
        const wrongType =
          accepted.length > 0 && !accepted.includes(`.${ext}`) && !accepted.includes("*");
        const failed = tooBig || wrongType;
        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          ext,
          progress: failed ? 100 : 0,
          status: failed ? "failed" : "uploading",
          error: tooBig
            ? `Too large (max ${maxSizeMB}MB)`
            : wrongType
              ? "Unsupported type"
              : undefined,
        };
      });

      setItems((prev) => (multiple ? [...prev, ...newItems] : newItems));
      newItems.forEach((it) => {
        if (it.status === "uploading") runUpload(it.id);
      });
    },
    [accept, maxSizeMB, multiple, runUpload]
  );

  const handleRemove = (id: string) => {
    stopTimer(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleRetry = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: "uploading", progress: 0, error: undefined } : it
      )
    );
    runUpload(id);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center transition-colors outline-none",
          dragging
            ? "border-foreground bg-muted/60"
            : "border-border bg-card hover:border-foreground/40 hover:bg-muted/40 focus-visible:border-foreground/40"
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
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FileRow key={item.id} item={item} onRemove={handleRemove} onRetry={handleRetry} />
          ))}
        </div>
      )}
    </div>
  );
}

export { InputFile as FileUpload };
