// src/components/AdminTable.jsx
import React from "react";

/**
 * Props supported:
 * - columns: [{ key: "user.email", label: "Email", className?, render?: (value, row) => ReactNode }]
 * - rows:    Array<object>
 * - actions: [{ label: "Ban", onClick: (row) => void, disabled?: (row) => boolean }]
 *
 * Also supports (optional, from admin page):
 * - loading: boolean
 * - data:    { items, total, page, pages }  -> rows will default to data.items if rows not provided
 * - type:    "users" | "bugs" | "audits"    -> only used for semantics/QA
 * - onRefresh: () => void                   -> optional refresh handler
 */
export default function AdminTable(props) {
  const {
    columns = [],
    rows: rowsProp = [],
    actions = [],
    loading = false,
    data = null,
    onRefresh = null,
  } = props;

  const rows = React.useMemo(() => {
    if (Array.isArray(rowsProp) && rowsProp.length) return rowsProp;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  }, [rowsProp, data]);

  const getByPath = (obj, path) => {
    if (!path) return obj;
    let cur = obj;
    for (const k of String(path).split(".")) {
      if (cur == null) return undefined;
      cur = cur[k];
    }
    return cur;
  };

  const renderCell = (col, row) => {
    const raw = getByPath(row, col.key);
    if (typeof col.render === "function") {
      try {
        return col.render(raw, row);
      } catch {
        return String(raw ?? "");
      }
    }
    // default rendering
    if (raw === null || raw === undefined) return "";
    if (raw instanceof Date) return raw.toLocaleString();
    if (typeof raw === "object") return JSON.stringify(raw);
    return String(raw);
  };

  // simple skeleton loader matching your table layout
  const skeletonRows = Array.from({ length: 6 });
  const hasActions = actions && actions.length > 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-xs text-slate-400">
          {data?.total ? `${data.total} total` : rows.length ? `${rows.length} items` : ""}
        </div>
        {typeof onRefresh === "function" && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 text-xs"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>

      <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
        <thead className="bg-slate-50 dark:bg-white/5">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            {hasActions ? (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody className="bg-white dark:bg-transparent divide-y divide-slate-100 dark:divide-white/10">
          {loading
            ? skeletonRows.map((_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((c) => (
                    <td key={`sk-${i}-${c.key}`} className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="h-7 w-20 bg-white/10 rounded animate-pulse" />
                    </td>
                  )}
                </tr>
              ))
            : rows.map((row, idx) => {
                const rowKey = row?._id || row?.id || idx;
                return (
                  <tr key={rowKey}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-2 whitespace-nowrap text-sm ${col.className || ""}`}
                        title={String(getByPath(row, col.key) ?? "")}
                      >
                        {renderCell(col, row)}
                      </td>
                    ))}

                    {hasActions ? (
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {actions.map((a, i) => {
                            const disabled =
                              typeof a.disabled === "function" ? !!a.disabled(row) : !!a.disabled;
                            return (
                              <button
                                key={i}
                                onClick={() => a.onClick && a.onClick(row)}
                                disabled={disabled}
                                className={`px-3 py-1 rounded-lg border border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 ${
                                  disabled ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                {a.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}

          {!loading && rows.length === 0 && (
            <tr>
              <td
                className="px-4 py-6 text-center text-slate-400"
                colSpan={columns.length + (hasActions ? 1 : 0)}
              >
                No data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
