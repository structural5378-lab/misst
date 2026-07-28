import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

// PermissionMatrix — grouped, searchable, collapsible permission toggles for
// the Role Editor. `catalog` comes from listCommunityRoles (the backend shared
// catalog). `selected` is an array of permission keys; onToggle(key) flips one.
export default function PermissionMatrix({ catalog = [], selected = [], onToggle }) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const sel = new Set(selected);
  const q = search.toLowerCase().trim();

  const filtered = catalog
    .map((c) => ({
      ...c,
      permissions: c.permissions.filter(
        (p) => !q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      ),
    }))
    .filter((c) => c.permissions.length);

  const toggleGroup = (id) => setCollapsed((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search permissions…"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-sm focus:border-primary outline-none"
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>{sel.size} permission(s) selected</span>
        <button onClick={() => setCollapsed({})} className="text-primary hover:underline">Expand all</button>
      </div>
      {filtered.map((cat) => {
        const count = cat.permissions.filter((p) => sel.has(p.key)).length;
        const isCol = !!collapsed[cat.id];
        return (
          <div key={cat.id} className="rounded-xl border border-border bg-card/30 overflow-hidden">
            <button onClick={() => toggleGroup(cat.id)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30">
              <span className="text-xs font-semibold text-foreground">
                {cat.label} <span className="text-muted-foreground font-normal">({count}/{cat.permissions.length})</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isCol ? '' : 'rotate-180'}`} />
            </button>
            {!isCol && (
              <div className="divide-y divide-border">
                {cat.permissions.map((p) => (
                  <label key={p.key} className="flex items-start gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer">
                    <input type="checkbox" checked={sel.has(p.key)} onChange={() => onToggle(p.key)} className="mt-0.5 accent-[hsl(var(--primary))]" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground">{p.description}</p>
                      <code className="text-[9px] text-muted-foreground/60">{p.key}</code>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}