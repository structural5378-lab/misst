import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Branding' },
  { id: 3, label: 'Visibility' },
  { id: 4, label: 'Review' }
];

export default function WizardProgress({ currentStep }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((step, idx) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isLast = idx === STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isComplete
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 -mt-5 rounded transition-colors ${
                  isComplete ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}