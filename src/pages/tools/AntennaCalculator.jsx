import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio, Signal, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function AntennaCalculator() {
  const [frequency, setFrequency] = useState("462.550");
  const [height, setHeight] = useState("");
  const [power, setPower] = useState("5");

  // GMRS frequencies
  const gmrsChannels = [
    { ch: 1, freq: "462.5625" }, { ch: 2, freq: "462.5875" }, { ch: 3, freq: "462.6125" },
    { ch: 4, freq: "462.6375" }, { ch: 5, freq: "462.6625" }, { ch: 6, freq: "462.6875" },
    { ch: 7, freq: "462.7125" }, { ch: 8, freq: "462.5500" }, { ch: 9, freq: "462.5750" },
    { ch: 10, freq: "462.6000" }, { ch: 11, freq: "462.6250" }, { ch: 12, freq: "462.6500" },
    { ch: 13, freq: "462.6750" }, { ch: 14, freq: "462.7000" }, { ch: 15, freq: "462.7250" },
    { ch: 16, freq: "462.7500" }, { ch: 17, freq: "462.7750" }, { ch: 18, freq: "462.8000" },
    { ch: 19, freq: "462.8250" }, { ch: 20, freq: "462.8500" }, { ch: 21, freq: "462.8750" },
    { ch: 22, freq: "462.9000" }, { ch: 23, freq: "462.9250" }, { ch: 24, freq: "462.9500" },
    { ch: 25, freq: "462.9750" }, { ch: 26, freq: "463.0000" }, { ch: 27, freq: "463.0250" },
    { ch: 28, freq: "463.0500" }, { ch: 29, freq: "463.0750" }, { ch: 30, freq: "463.1000" },
  ];

  const freqMHz = parseFloat(frequency);
  const wavelength = 300 / freqMHz;
  const quarterWave = (wavelength / 4) * 3.28084; // in feet
  const halfWave = (wavelength / 2) * 3.28084;
  const fullWave = wavelength * 3.28084;

  // Range estimation (simplified: horizon distance from height)
  const heightFt = parseFloat(height) || 0;
  const horizonMiles = 1.23 * Math.sqrt(heightFt);
  const horizonKm = horizonMiles * 1.60934;

  return (
    <div>
      <PageHeader title="Antenna Calculator" showBack />
      <div className="px-4 pt-4 space-y-6 pb-4">
        {/* Frequency Selection */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            Select Frequency
          </h3>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full p-2 rounded-lg bg-background border border-border text-foreground text-sm"
          >
            {gmrsChannels.map((c) => (
              <option key={c.ch} value={c.freq}>
                Channel {c.ch} - {c.freq} MHz
              </option>
            ))}
            <option value="custom">Custom Frequency...</option>
          </select>
          {frequency === "custom" && (
            <Input
              type="number"
              placeholder="Enter frequency (MHz)"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        {/* Antenna Lengths */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Signal className="w-4 h-4 text-primary" />
            Antenna Lengths
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <span className="text-sm text-muted-foreground">1/4 Wave</span>
              <span className="text-sm font-semibold text-foreground">{quarterWave.toFixed(2)} ft</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <span className="text-sm text-muted-foreground">1/2 Wave</span>
              <span className="text-sm font-semibold text-foreground">{halfWave.toFixed(2)} ft</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <span className="text-sm text-muted-foreground">Full Wave</span>
              <span className="text-sm font-semibold text-foreground">{fullWave.toFixed(2)} ft</span>
            </div>
          </div>
        </div>

        {/* Range Calculator */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-primary" />
            Range Estimator
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Antenna Height (feet)</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Power (watts)</label>
              <Input
                type="number"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            {heightFt > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{horizonMiles.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Miles</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{horizonKm.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Kilometers</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Line-of-sight horizon distance from {heightFt} ft antenna height
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}