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
      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <label className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">Rows per page</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
              className="rounded-md px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
                  ? "rounded-md bg-zinc-900 px-3 py-1 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "rounded-md px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }
            >
              {n}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={hrefForPage(page + 1)}
              className="rounded-md px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
