import Form from "next/form";
import Link from "next/link";
import { inputClass } from "@/components/field";
import { leadListHref, MAX_SEARCH_LENGTH, type LeadListQuery } from "./lead-list-query";

export function LeadSearch({ status, q }: Pick<LeadListQuery, "status" | "q">) {
  return (
    <Form action="/dashboard" role="search" className="flex items-center gap-2">
      {status && <input type="hidden" name="status" value={status} />}
      <label className="flex-1">
        <span className="sr-only">Search requests</span>
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Search by name or phone"
          className={`${inputClass} w-full`}
        />
      </label>
      <button type="submit" className="rounded-field border border-ink px-4 py-2.5 text-sm font-semibold hover:bg-surface">
        Search
      </button>
      {q && (
        <Link href={leadListHref({ status })} className="text-sm font-medium text-muted hover:text-ink">
          Clear
        </Link>
      )}
    </Form>
  );
}

type PaginationProps = { query: LeadListQuery; shown: number; pageSize: number; hasNext: boolean };

export function Pagination({ query, shown, pageSize, hasNext }: PaginationProps) {
  const { page } = query;
  if (page === 1 && !hasNext) return null;
  const from = (page - 1) * pageSize + 1;
  const link = "rounded-field border border-rule px-3.5 py-2 text-sm font-medium hover:border-muted";

  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={leadListHref({ ...query, page: page - 1 })} rel="prev" className={link}>
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted tabular-nums">
        {shown > 0 ? `${from}–${from + shown - 1}` : `Page ${page}`}
      </p>
      {hasNext ? (
        <Link href={leadListHref({ ...query, page: page + 1 })} rel="next" className={link}>
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
