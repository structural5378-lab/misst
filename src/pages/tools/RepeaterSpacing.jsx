import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Signal, MapPin } from "lucide-react";

export default function RepeaterSpacing() {
  const [freq1, setFreq1] = useState("");
  const [freq2, setFreq2] = useState("");

  const f1 = parseFloat(freq1) || 0;
  const f2 = parseFloat(freq2) || 0;
  const spacing = Math.abs(f1 - f2);

  // Recommended minimum spacing to avoid interference
  const minSpacing = 0.025; // 25 kHz
  const idealSpacing = 0.050; // 50 kHz
  const isOk = spacing >= minSpacing;
  const isIdeal = spacing >= idealSpacing;

  return (
    <div>
      <PageHeader title="Repeater Spacing" showBack />
      <div className="px-4 pt-4 space-y-6 pb-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Signal className="w-4 h-4 text-primary" />
            Frequency Coordination
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Enter two repeater frequencies to check if they have adequate spacing to avoid interference.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Repeater 1 Frequency (MHz)</label>
              <Input
                type="number"
                step="0.0001"
                value={freq1}
                onChange={(e) => setFreq1(e.target.value)}
                placeholder="e.g. 462.550"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Repeater 2 Frequency (MHz)</label>
              <Input
                type="number"
                step="0.0001"
                value={freq2}
                onChange={(e) => setFreq2(e.target.value)}
                placeholder="e.g. 462.600"
              />
            </div>
          </div>
        </div>

        {f1 > 0 && f2 > 0 && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Analysis</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 text-center">
                <p className="text-3xl font-bold text-primary">{(spacing * 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">kHz Spacing</p>
              </div>

              {isOk ? (
                <div className={`p-4 rounded-lg border ${
                  isIdeal
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                }`}>
                  <p className={`text-sm font-medium ${
                    isIdeal ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {isIdeal ? "✓ Ideal spacing" : "⚠ Minimum spacing"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isIdeal
                      ? "These frequencies have adequate separation to avoid interference."
                      : "These frequencies meet minimum requirements but may experience some interference in fringe areas."}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400 font-medium">
                    ✗ Insufficient spacing
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    These frequencies are too close and will likely cause interference. Increase spacing to at least 25 kHz.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="text-sm font-semibold text-foreground mb-2">Guidelines</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Minimum spacing: 25 kHz (adjacent channels)</li>
                  <li>• Ideal spacing: 50 kHz or more</li>
                  <li>• Consider terrain and repeater power</li>
                  <li>• Coordinate with local repeater council</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}