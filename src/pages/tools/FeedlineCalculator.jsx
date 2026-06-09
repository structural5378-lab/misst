import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cable } from "lucide-react";

const cableTypes = [
  { name: "RG-58", loss100: 5.8 }, // dB per 100 ft at 450 MHz
  { name: "RG-8X", loss100: 3.9 },
  { name: "RG-213", loss100: 2.8 },
  { name: "LMR-240", loss100: 3.9 },
  { name: "LMR-400", loss100: 1.5 },
  { name: "LMR-600", loss100: 0.9 },
  { name: "LMR-900", loss100: 0.6 },
];

export default function FeedlineCalculator() {
  const [cableType, setCableType] = useState("LMR-400");
  const [length, setLength] = useState("");
  const [frequency, setFrequency] = useState("462.550");

  const selectedCable = cableTypes.find((c) => c.name === cableType);
  const lengthFt = parseFloat(length) || 0;
  const freqMHz = parseFloat(frequency) || 462.55;

  // Adjust loss for frequency (approximate: loss ∝ √frequency)
  const baseFreq = 450;
  const freqFactor = Math.sqrt(freqMHz / baseFreq);
  const lossPer100 = (selectedCable?.loss100 || 0) * freqFactor;
  const totalLoss = (lossPer100 * lengthFt) / 100;
  const powerEfficiency = Math.pow(10, -totalLoss / 10) * 100;

  return (
    <div>
      <PageHeader title="Feedline Loss Calculator" showBack />
      <div className="px-4 pt-4 space-y-6 pb-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Cable className="w-4 h-4 text-primary" />
            Cable Specifications
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cable Type</label>
              <Select value={cableType} onValueChange={setCableType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cableTypes.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name} ({c.loss100} dB/100ft @ 450 MHz)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Length (feet)</label>
              <Input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frequency (MHz)</label>
              <Input
                type="number"
                step="0.0001"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. 462.550"
              />
            </div>
          </div>
        </div>

        {lengthFt > 0 && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Results</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-background/50 text-center">
                  <p className="text-3xl font-bold text-primary">{totalLoss.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Loss (dB)</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 text-center">
                  <p className="text-3xl font-bold text-emerald-400">{powerEfficiency.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Power Efficiency</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-foreground">
                  At {frequency} MHz, {selectedCable?.name} loses approximately{" "}
                  <span className="font-semibold">{lossPer100.toFixed(2)} dB</span> per 100 feet.
                </p>
                <p className="text-sm text-foreground mt-2">
                  For {lengthFt} feet, you'll lose <span className="font-semibold">{totalLoss.toFixed(2)} dB</span> of signal.
                </p>
              </div>
              {totalLoss > 3 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-400 font-medium">
                    ⚠ High loss detected! Consider using lower-loss cable (e.g., LMR-600 or LMR-900) for runs over 50 feet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}