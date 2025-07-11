'use client';

import { useState } from 'react';
import { ShieldCheck, ListChecks } from 'lucide-react';
import { generateRiskStatement } from '@/ai/flows/generate-risk-statement';
import { generateRiskDescription } from '@/ai/flows/generate-risk-description';
import { rateRisk } from '@/ai/flows/rate-risk';
import { generateSuggestedControls } from '@/ai/flows/generate-suggested-controls';
import { generateClarifyingQuestions } from '@/ai/flows/generate-clarifying-questions';
import { RiskForm } from '@/components/risk-form';
import { RiskResults } from '@/components/risk-results';
import { type RiskAssessment } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Loader } from '@/components/loader';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Step = 'form' | 'loading' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('form');
  const [results, setResults] = useState<RiskAssessment | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = async (data: { technology: string; controlDeficiencies: string }) => {
    setStep('loading');
    setResults(null);
    try {
      const { technology, controlDeficiencies } = data;

      const { riskStatement } = await generateRiskStatement({ technology, controlDeficiencies });

      const [
        riskDescriptionResult,
        rateRiskResult,
        suggestedControlsResult,
        clarifyingQuestionsResult
      ] = await Promise.all([
         generateRiskDescription({ technology, riskStatement, controlDeficiencies }),
         rateRisk({ technology, deficiencies: controlDeficiencies, riskStatement, riskDescription: "" }),
         generateSuggestedControls({ technology, riskStatement, riskDescription: "", controlDeficiencies }),
         generateClarifyingQuestions({ technology, controlDeficiencies })
      ]);
      
      const { riskDescription } = riskDescriptionResult;
      const { likelihood, impact, ciaImpact } = rateRiskResult;
      const { suggestedControls } = suggestedControlsResult;

      const newAssessment: RiskAssessment = {
        id: new Date().toISOString(),
        technology,
        controlDeficiencies,
        riskStatement,
        riskDescription,
        // Set initial and residual risk to be the same at first
        initialLikelihood: likelihood,
        initialImpact: impact,
        initialCiaImpact: ciaImpact,
        likelihood,
        impact,
        ciaImpact,
        controls: [],
        suggestedControls: suggestedControls || [],
        clarifyingQuestions: clarifyingQuestionsResult.questions,
        questionAnswers: new Array(clarifyingQuestionsResult.questions.length).fill('')
      };

      setResults(newAssessment);
      setStep('results');
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to generate initial risk assessment. Please try again.",
      });
      setStep('form');
    }
  };
  
  const handleUpdateAssessment = (updatedAssessment: RiskAssessment) => {
    setResults(updatedAssessment);
  };

  const startOver = () => {
    setStep('form');
    setResults(null);
  }

  const isLoading = step === 'loading';

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-background p-4 sm:p-8">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Link href="/risks">
            <Button variant="outline">
                <ListChecks className="mr-2 h-4 w-4"/>
                View Saved Risks
            </Button>
        </Link>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl mx-auto">
        <header className="flex items-center justify-center mb-8 text-center">
          <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary mr-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">RiskWise</h1>
        </header>

        <main className="space-y-8">
          {step === 'form' && <RiskForm onSubmit={handleFormSubmit} isLoading={isLoading} />}
          {isLoading && <Loader text="Generating Initial Assessment..." />}
          {step === 'results' && results && (
            <RiskResults 
              initialData={results} 
              onStartOver={startOver} 
              onAssessmentUpdate={handleUpdateAssessment}
            />
          )}
        </main>
      </div>
    </div>
  );
}
