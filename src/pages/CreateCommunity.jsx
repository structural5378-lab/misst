import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMistUser } from "@/hooks/useMistUser";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Rocket } from 'lucide-react';
import WizardProgress from '@/components/community/wizard/WizardProgress';
import StepBasics from '@/components/community/wizard/StepBasics';
import StepBranding from '@/components/community/wizard/StepBranding';
import StepVisibility from '@/components/community/wizard/StepVisibility';
import StepReview from '@/components/community/wizard/StepReview';

const INITIAL_DATA = {
  name: '',
  slug: '',
  category: '',
  description: '',
  location: '',
  banner_url: '',
  logo_url: '',
  primary_color: '#8B5CF6',
  accent_color: '#06B6D4',
  visibility_mode: 'private',
  _slugManuallyEdited: false
};

export default function CreateCommunity() {
  const navigate = useNavigate();
  const { mybbUser } = useMistUser();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(INITIAL_DATA);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

  // --- Per-step validation ---
  const validateStep = (stepNum) => {
    const errs = {};
    if (stepNum === 1) {
      if (!data.name.trim()) errs.name = 'Community name is required';
      else if (data.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
      if (!data.slug) errs.slug = 'Slug is required';
      else if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(data.slug))
        errs.slug = 'Invalid slug format (lowercase, numbers, hyphens, 2–40 chars)';
      if (!data.category) errs.category = 'Please select a category';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  // --- Submit to backend ---
  const handleCreate = async () => {
    if (!mybbUser) {
      setSubmitError('You must be logged in to create a community');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Strip internal-only fields before sending
      const payload = { ...data };
      delete payload._slugManuallyEdited;

      const res = await base44.functions.invoke('createCommunityV2', payload);
      const community = res.data?.community;

      if (community?.slug) {
        // Redirect to the newly created community home page
        navigate(`/c/${community.slug}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.error || err?.message || 'Failed to create community'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <button
            onClick={() => (step > 1 ? handleBack() : navigate('/'))}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <h1 className="text-sm font-bold text-foreground">Create Community</h1>
          <span className="text-xs text-muted-foreground font-mono">{step}/4</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        <WizardProgress currentStep={step} />

        <div className="mb-6">
          {step === 1 && <StepBasics data={data} update={update} errors={errors} />}
          {step === 2 && <StepBranding data={data} update={update} />}
          {step === 3 && <StepVisibility data={data} update={update} />}
          {step === 4 && <StepReview data={data} />}
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step < 4 ? (
            <Button onClick={handleNext} className="w-full" size="lg">
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Community...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Create Community
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}