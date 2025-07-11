'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { generateRiskStatement } from '@/ai/flows/generate-risk-statement';
import { generateRiskDescription } from '@/ai/flows/generate-risk-description';
import { rateRisk } from '@/ai/flows/rate-risk';
import { generateSuggestedControls } from '@/ai/flows/generate-suggested-controls';
import { generateClarifyingQuestions } from '@/ai/flows/generate-clarifying-questions';
import { RiskForm } from '@/components/risk-form';
import { Questionnaire } from '@/components/questionnaire';
import { RiskResults } from '@/components/risk-results';
import { type RiskAssessment } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Loader } from '@/components/loader';
import { ThemeToggle } from '@/components/theme-toggle';

type Step = 'form' | 'questions' | 'loading' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<{ technology: string; controlDeficiencies: string } | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<RiskAssessment | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = async (data: { technology: string; controlDeficiencies: string }) => {
    setStep('loading');
    setResults(null);
    setFormData(data);
    try {
      const { questions } = await generateClarifyingQuestions(data);
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(''));
      setStep('questions');
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to generate clarifying questions. Please try again.",
      });
      setStep('form');
    }
  };

  const handleQuestionnaireSubmit = async (finalAnswers: string[]) => {
    setStep('loading');
    if (!formData) return;

    try {
      const { technology, controlDeficiencies } = formData;
      const qna = questions.map((q, i) => `${q}\nAnswer: ${finalAnswers[i]}`).join('\n\n');
      const enrichedDeficiencies = `${controlDeficiencies}\n\nAdditional Context from Q&A:\n${qna}`;

      const { riskStatement } = await generateRiskStatement({ technology, controlDeficiencies: enrichedDeficiencies });
      const { riskDescription } = await generateRiskDescription({ technology, riskStatement, controlDeficiencies: enrichedDeficiencies });
      const { likelihood, impact } = await rateRisk({
        technology,
        deficiencies: enrichedDeficiencies,
        riskStatement,
        riskDescription,
      });
      const { suggestedControls } = await generateSuggestedControls({
        technology,
        riskStatement,
        riskDescription,
        controlDeficiencies: enrichedDeficiencies,
      });

      setResults({
        technology,
        controlDeficiencies,
        riskStatement,
        riskDescription,
        likelihood,
        impact,
        controls: [],
        suggestedControls: suggestedControls || [],
      });
      setStep('results');
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to generate risk assessment. Please try again.",
      });
      setStep('form');
    }
  };

  const startOver = () => {
    setStep('form');
    setResults(null);
    setFormData(null);
    setQuestions([]);
    setAnswers([]);
  }

  const isLoading = step === 'loading';

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-background p-4 sm:p-8">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl mx-auto">
        <header className="flex items-center justify-center mb-8 text-center">
          <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary mr-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">RiskWise</h1>
        </header>

        <main className="space-y-8">
          {step === 'form' && <RiskForm onSubmit={handleFormSubmit} isLoading={isLoading} />}
          {step === 'questions' && (
            <Questionnaire
              questions={questions}
              answers={answers}
              setAnswers={setAnswers}
              onSubmit={handleQuestionnaireSubmit}
              isLoading={isLoading}
            />
          )}
          {isLoading && <Loader text={step === 'loading' && questions.length > 0 ? "Generating Full Assessment..." : "Generating Questions..."} />}
          {step === 'results' && results && (
            <>
              <RiskResults data={results} onStartOver={startOver} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
