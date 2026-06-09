import React from "react";
import PageHeader from "@/components/layout/PageHeader";
import { BarChart3 } from "lucide-react";

const gmrsChannels = [
  { ch: 1, freq: "462.5625", power: "5W", usage: "Mobile/Handheld" },
  { ch: 2, freq: "462.5875", power: "5W", usage: "Mobile/Handheld" },
  { ch: 3, freq: "462.6125", power: "5W", usage: "Mobile/Handheld" },
  { ch: 4, freq: "462.6375", power: "5W", usage: "Mobile/Handheld" },
  { ch: 5, freq: "462.6625", power: "5W", usage: "Mobile/Handheld" },
  { ch: 6, freq: "462.6875", power: "5W", usage: "Mobile/Handheld" },
  { ch: 7, freq: "462.7125", power: "5W", usage: "Mobile/Handheld" },
  { ch: 8, freq: "462.5500", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 9, freq: "462.5750", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 10, freq: "462.6000", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 11, freq: "462.6250", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 12, freq: "462.6500", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 13, freq: "462.6750", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 14, freq: "462.7000", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 15, freq: "462.7250", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 16, freq: "462.7500", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 17, freq: "462.7750", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 18, freq: "462.8000", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 19, freq: "462.8250", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 20, freq: "462.8500", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 21, freq: "462.8750", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 22, freq: "462.9000", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 23, freq: "462.9250", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 24, freq: "462.9500", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 25, freq: "462.9750", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 26, freq: "463.0000", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 27, freq: "463.0250", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 28, freq: "463.0500", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 29, freq: "463.0750", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 30, freq: "463.1000", power: "0.5W", usage: "Handheld only (FRS)" },
  { ch: 31, freq: "467.5625", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 32, freq: "467.5875", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 33, freq: "467.6125", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 34, freq: "467.6375", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 35, freq: "467.6625", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 36, freq: "467.6875", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 37, freq: "467.7125", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 38, freq: "467.7375", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 39, freq: "467.7625", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 40, freq: "467.7875", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 41, freq: "467.8125", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 42, freq: "467.8375", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 43, freq: "467.8625", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 44, freq: "467.8875", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 45, freq: "467.9125", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 46, freq: "467.9375", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 47, freq: "467.9625", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 48, freq: "467.9875", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 49, freq: "468.0125", power: "0.5W", usage: "Simplex (FRS only)" },
  { ch: 50, freq: "468.0375", power: "0.5W", usage: "Simplex (FRS only)" },
];

export default function FrequencyReference() {
  return (
    <div>
      <PageHeader title="GMRS Frequency Reference" showBack />
      <div className="px-4 pt-4 pb-4">
        <div className="p-4 rounded-xl bg-card border border-border mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Complete GMRS Channel Guide
          </h3>
          <p className="text-xs text-muted-foreground mt-2">
            Channels 1-7: 5W mobile/handheld | Channels 8-30: 0.5W FRS only | Channels 31-50: FRS simplex
          </p>
        </div>

        <div className="space-y-2">
          {gmrsChannels.map((ch) => (
            <div
              key={ch.ch}
              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{ch.ch}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{ch.freq} MHz</p>
                  <p className="text-xs text-muted-foreground">{ch.usage}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                ch.power === "5W" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
              }`}>
                {ch.power}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}