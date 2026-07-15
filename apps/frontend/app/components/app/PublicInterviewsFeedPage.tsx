import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import EmptyState from "./EmptyState";
import { SectionHeader } from "./DashboardSections";
import {
  PublicInterviewFeedCard,
  PublicInterviewFeedCardSkeleton,
  type PublicInterviewFeedItem,
} from "./PublicInterviewFeedCard";
import { BACKEND_URL } from "~/lib/config";

const PAGE_SIZE = 24;

export function PublicInterviewsFeedPage() {
  const [items, setItems] = useState<PublicInterviewFeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async (afterCursor: string | null) => {
    const res = await axios.get(`${BACKEND_URL}/interview/public`, {
      params: { limit: PAGE_SIZE, ...(afterCursor ? { cursor: afterCursor } : {}) },
    });
    const { interviews, nextCursor } = res.data?.data ?? {};
    setItems((prev) => (afterCursor ? [...prev, ...(interviews ?? [])] : interviews ?? []));
    setCursor(nextCursor ?? null);
    setHasMore(Boolean(nextCursor));
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPage(null)
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadPage(cursor);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Community"
        title="Public interviews"
        description="Every recording candidates have chosen to share publicly, newest first."
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PublicInterviewFeedCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((interview) => (
              <PublicInterviewFeedCard key={interview.id} interview={interview} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="gap-1.5">
                {loadingMore && <Loader2 className="size-4 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Globe}
          title="No public interviews yet"
          description="Once candidates share a recording from their profile, it shows up here for everyone to see."
        />
      )}
    </div>
  );
}
