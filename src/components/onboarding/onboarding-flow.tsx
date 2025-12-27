'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BrandStep from './brand-step'
import AmazonStep from './amazon-step'
import CompetitorsStep from './competitors-step'

interface PlanLimits {
  plan: string
  max_competitors: number
  max_amazon_urls: number
  report_frequency: string
}

interface OnboardingData {
  brandName: string
  instagramHandle: string
  amazonUrls: string[]
  competitors: Array<{ name: string; instagramHandle: string }>
}

export default function OnboardingFlow({ planLimits }: { planLimits: PlanLimits }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    brandName: '',
    instagramHandle: '',
    amazonUrls: [],
    competitors: [],
  })
  const [loading, setLoading] = useState(false)

  const handleNext = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }))
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async (stepData: Partial<OnboardingData>) => {
    setLoading(true)
    const finalData = { ...data, ...stepData }

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Onboarding error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded ${
                  s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">Step {step} of 3</span>
        </div>
      </div>

      {step === 1 && (
        <BrandStep
          data={data}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {step === 2 && (
        <AmazonStep
          data={data}
          planLimits={planLimits}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <CompetitorsStep
          data={data}
          planLimits={planLimits}
          onComplete={handleComplete}
          onBack={handleBack}
          loading={loading}
        />
      )}
    </div>
  )
}

