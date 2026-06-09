import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Signal, Search } from "lucide-react";

const plTones = [
  { freq: 67.0, code: "XZ" }, { freq: 69.3, code: "WZ" }, { freq: 71.9, code: "YZ" },
  { freq: 74.4, code: "2Z" }, { freq: 77.0, code: "0Z" }, { freq: 79.7, code: "1Z" },
  { freq: 82.5, code: "9Z" }, { freq: 85.4, code: "4Z" }, { freq: 88.5, code: "5Z" },
  { freq: 91.5, code: "6Z" }, { freq: 94.8, code: "7Z" }, { freq: 97.4, code: "8Z" },
  { freq: 100.0, code: "6A" }, { freq: 103.5, code: "1A" }, { freq: 107.2, code: "2A" },
  { freq: 110.9, code: "3A" }, { freq: 114.8, code: "4A" }, { freq: 118.8, code: "5A" },
  { freq: 123.0, code: "6A" }, { freq: 127.3, code: "7A" }, { freq: 131.8, code: "8A" },
  { freq: 136.5, code: "9A" }, { freq: 141.3, code: "0A" }, { freq: 146.2, code: "1A" },
  { freq: 151.4, code: "2A" }, { freq: 156.7, code: "3A" }, { freq: 159.8, code: "4A" },
  { freq: 162.2, code: "5A" }, { freq: 165.5, code: "6A" }, { freq: 167.9, code: "7A" },
  { freq: 171.3, code: "8A" }, { freq: 173.8, code: "9A" }, { freq: 177.3, code: "0B" },
  { freq: 179.9, code: "1B" }, { freq: 183.5, code: "2B" }, { freq: 186.2, code: "3B" },
  { freq: 189.9, code: "4B" }, { freq: 192.8, code: "5B" }, { freq: 196.6, code: "6B" },
  { freq: 199.5, code: "7B" }, { freq: 203.5, code: "8B" }, { freq: 206.5, code: "9B" },
  { freq: 210.7, code: "0C" }, { freq: 218.1, code: "1C" }, { freq: 225.7, code: "2C" },
  { freq: 229.1, code: "3C" }, { freq: 233.6, code: "4C" }, { freq: 241.8, code: "5C" },
  { freq: 250.3, code: "6C" }, { freq: 254.1, code: "7C" },
];

export default function PLToneLookup() {
  const [search, setSearch] = useState("");
  const [selectedFreq, setSelectedFreq] = useState("");

  const filtered = plTones.filter((t) => {
    const searchLower = search.toLowerCase();
    return (
      t.freq.toString().includes(search) ||
      t.code.toLowerCase().includes(searchLower)
    );
  });

  const selected = plTones.find((t) => t.freq.toString() === selectedFreq);

  return (
    <div>
      <PageHeader title="PL Tone Lookup" showBack />
      <div className="px-4 pt-4 space-y-6 pb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by frequency or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tone List */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Signal className="w-4 h-4 text-primary" />
            PL Tones ({filtered.length})
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {filtered.map((tone) => (
              <button
                key={tone.freq}
                onClick={() => setSelectedFreq(tone.freq.toString())}
                className={`w-full flex justify-between items-center p-3 rounded-lg transition-colors ${
                  selectedFreq === tone.freq.toString()
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-background/50 hover:bg-background/80"
                }`}
              >
                <span className="text-sm font-semibold text-foreground">{tone.freq} Hz</span>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">{tone.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Tone Details */}
        {selected && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Selected Tone</h3>
            <div className="p-6 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-4xl font-bold text-primary">{selected.freq} Hz</p>
              <p className="text-sm text-muted-foreground mt-2">Code: {selected.code}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Commonly used for repeater access and privacy squelch
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}