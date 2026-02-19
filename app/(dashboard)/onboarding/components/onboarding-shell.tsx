'use client'

import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Organization' },
  { number: 2, label: 'Board' },
  { number: 3, label: 'Widget' },
  { number: 4, label: 'Identity' },
  { number: 5, label: 'Integrations' },
  { number: 6, label: 'Team' },
]

interface OnboardingShellProps {
  currentStep: number
  children: React.ReactNode
  onSkipAll: () => void
  onStepClick?: (step: number) => void
}

export function OnboardingShell({ currentStep, children, onSkipAll, onStepClick }: OnboardingShellProps) {
  const progress = Math.round(((currentStep - 1) / STEPS.length) * 100)

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Setup Guide</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Step {currentStep} of {STEPS.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-400 tabular-nums">{progress}%</span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={step.number > currentStep}
                onClick={() => step.number <= currentStep && onStepClick?.(step.number)}
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                    ${step.number < currentStep
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-200/50 group-hover:shadow-amber-300/50 group-hover:scale-105'
                      : step.number === currentStep
                        ? 'bg-white border-2 border-amber-400 text-amber-600 shadow-sm'
                        : 'bg-gray-50 text-gray-300 border border-gray-200'
                    }
                  `}
                >
                  {step.number < currentStep ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`
                    text-[10px] font-medium hidden sm:block leading-none transition-colors
                    ${step.number < currentStep
                      ? 'text-gray-500 group-hover:text-gray-700'
                      : step.number === currentStep
                        ? 'text-gray-700'
                        : 'text-gray-300'
                    }
                  `}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-1.5 mb-5 sm:mb-5">
                  <div
                    className={`
                      h-[2px] rounded-full transition-all duration-500
                      ${step.number < currentStep ? 'bg-amber-400' : 'bg-gray-100'}
                    `}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {children}
      </div>

      {/* Skip to Dashboard */}
      <div className="mt-5 text-center">
        <button
          onClick={onSkipAll}
          className="text-[13px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          Skip setup and go to Dashboard
        </button>
      </div>
    </div>
  )
}
