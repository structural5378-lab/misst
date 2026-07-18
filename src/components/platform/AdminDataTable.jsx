import React, { useState, useMemo } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function toCSV(rows, columns) {
  const headers = columns.map((c) => c.header);
  const escape = (v) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(columns.map((c) => escape(c.exportVal ? c.exportVal(r) : r[c.key])).join(","));
  return lines.join("\n");
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toXLS(rows, columns) {
  const esc = (v) => String(v ?? "").replace(/</g, "&lt;");
  let html = "<table><tr>" + columns.map((c) => `<th>${esc(c.header)}</th>`).join("") + "</tr>";
  for (const r of rows) html += "<tr>" + columns.map((c) => `<td>${esc(c.exportVal ? c.exportVal(r) : r[c.key])}</td>`).join("") + "</tr>";
  html += "</table>";
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${html}</body></html>`;
}

export default function AdminDataTable({
  columns,
  rows,
  searchKeys,
  pageSize = 10,
  bulkActions = [],
  exportFilename = "export",
  rowKey = "id",
  emptyMessage = "No records found.",
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    let r = rows;
    if (query && searchKeys?.length) {
      const q = query.toLowerCase();
      r = r.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)));
    }
    if (sortKey) {
      r = [...r].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return r;
  }, [rows, query, searchKeys, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r[rowKey]));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) pageRows.forEach((r) => next.delete(r[rowKey]));
    else pageRows.forEach((r) => next.add(r[rowKey]));
    setSelected(next);
  };
  const toggleRow = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between p-3 border-b border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search…" className="pl-8 h-9" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && <span className="text-xs text-muted-foreground">{selected.size} selected</span>}
          {bulkActions.map((ba, i) => (
            <Button key={i} size="sm" variant={ba.variant || "secondary"} onClick={() => ba.onClick(Array.from(selected).map((id) => rows.find((r) => r[rowKey] === id)).filter(Boolean))}>
              {ba.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => download(`${exportFilename}.csv`, toCSV(filtered, columns), "text/csv")}><Download className="w-3.5 h-3.5" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => download(`${exportFilename}.xls`, toXLS(filtered, columns), "application/vnd.ms-excel")}><FileSpreadsheet className="w-3.5 h-3.5" />Excel</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {bulkActions.length > 0 && (
                <th className="w-10 px-3 py-2"><button onClick={toggleAll}>{allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}</button></th>
              )}
              {columns.map((c) => (
                <th key={c.key} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                  {c.sortable ? (
                    <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.header}
                      {sortKey === c.key ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r[rowKey]} className="border-t border-border hover:bg-muted/30">
                {bulkActions.length > 0 && (
                  <td className="px-3 py-2"><button onClick={() => toggleRow(r[rowKey])}>{selected.has(r[rowKey]) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}</button></td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-foreground/90 whitespace-nowrap">{c.render ? c.render(r) : String(r[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={columns.length + (bulkActions.length ? 1 : 0)} className="px-3 py-8 text-center text-muted-foreground text-sm">{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
        <span>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span>Page {safePage + 1} of {pageCount}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}