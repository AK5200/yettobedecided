'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { OnboardingShell } from './components/onboarding-shell'
import { StepOrg } from './components/step-org'
import { StepBoard } from './components/step-board'
import { StepWidget } from './components/step-widget'
import { StepIdentity } from './components/step-identity'
import { StepIntegrations } from './components/step-integrations'
import { StepTeam } from './components/step-team'
import { Celebration } from './components/celebration'

const TOTAL_STEPS = 6

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Check if user already has an org
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (membership?.org_id) {
          setOrgId(membership.org_id)

          // Get org slug and onboarding progress
          const res = await fetch('/api/onboarding/progress')
          const progress = await res.json()

          if (progress.org_slug) {
            setOrgSlug(progress.org_slug)
          }

          // Resume at next incomplete step
          const savedStep = progress.onboarding_step || 0
          setCurrentStep(Math.min(savedStep + 1, TOTAL_STEPS))
        }
        // If no membership, start at step 1 (org creation)
      } catch {
        // Start fresh
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const saveProgress = async (step: number, completed?: boolean) => {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, completed }),
      })
    } catch {
      // Non-critical, continue
    }
  }

  const finishOnboarding = useCallback(async () => {
    await saveProgress(TOTAL_STEPS, true)
    setCelebrating(true)
  }, [])

  const handleStepComplete = async (step: number) => {
    if (step >= TOTAL_STEPS) {
      await finishOnboarding()
      return
    }

    await saveProgress(step)
    setCurrentStep(step + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkipAll = async () => {
    await finishOnboarding()
  }

  const handleOrgComplete = async (newOrgId: string, newOrgSlug: string) => {
    setOrgId(newOrgId)
    setOrgSlug(newOrgSlug)
    await saveProgress(1)
    setCurrentStep(2)
  }

  const handleCelebrationDone = useCallback(() => {
    window.location.href = '/dashboard'
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (celebrating) {
    return <Celebration onComplete={handleCelebrationDone} />
  }

  return (
    <OnboardingShell currentStep={currentStep} onSkipAll={handleSkipAll} onStepClick={(step) => setCurrentStep(step)}>
      {currentStep === 1 && (
        <StepOrg onComplete={handleOrgComplete} />
      )}
      {currentStep === 2 && orgId && (
        <StepBoard
          orgId={orgId}
          onComplete={() => handleStepComplete(2)}
          onBack={handleBack}
        />
      )}
      {currentStep === 3 && orgSlug && (
        <StepWidget
          orgSlug={orgSlug}
          onComplete={() => handleStepComplete(3)}
          onBack={handleBack}
        />
      )}
      {currentStep === 4 && (
        <StepIdentity
          onComplete={() => handleStepComplete(4)}
          onBack={handleBack}
        />
      )}
      {currentStep === 5 && (
        <StepIntegrations
          onComplete={() => handleStepComplete(5)}
          onBack={handleBack}
        />
      )}
      {currentStep === 6 && orgId && (
        <StepTeam
          orgId={orgId}
          onComplete={() => handleStepComplete(6)}
          onBack={handleBack}
        />
      )}
    </OnboardingShell>
  )
}
