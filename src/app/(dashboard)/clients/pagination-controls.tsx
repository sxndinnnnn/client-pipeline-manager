"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const MAX_PAGE_BUTTONS = 5;

export function PaginationControls({
  total,
  page,
  pageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function hrefForPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));
    return `${pathname}?${params.toString()}`;
  }

  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("pageSize", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  let windowStart = Math.max(1, page - Math.floor(MAX_PAGE_BUTTONS / 2));
  const windowEnd = Math.min(totalPages, windowStart + MAX_PAGE_BUTTONS - 1);
  windowStart = Math.max(1, windowEnd - MAX_PAGE_BUTTONS + 1);
  const pageNumbers = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <label className="flex items-center gap-2">
          <span className="font-medium text-foreground">Rows Per Page</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="rounded-md border border-border-strong bg-surface px-2 py-1 text-sm text-foreground"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span>
          {from}-{to} of {total}
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 && (
            <Link
              href={hrefForPage(page - 1)}
              className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-sunken"
            >
              Previous
            </Link>
          )}
          {pageNumbers.map((n) => (
            <Link
              key={n}
              href={hrefForPage(n)}
              className={
                n === page
                  ? "rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                  : "rounded-md px-3 py-1 text-sm font-medium text-muted hover:bg-surface-sunken"
              }
            >
              {n}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={hrefForPage(page + 1)}
              className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-sunken"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
