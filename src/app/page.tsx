'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { generateRiskStatement } from '@/ai/flows/generate-risk-statement';
import { generateRiskDescription } from '@/ai/flows/generate-risk-description';
import { rateRisk } from '@/ai/flows/rate-risk';
import { RiskForm } from '@/components/risk-form';
import { RiskResults } from '@/components/risk-results';
import { type RiskAssessment } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Loader } from '@/components/loader';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RiskAssessment | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = async (data: { technology: string; controlDeficiencies: string }) => {
    setIsLoading(true);
    setResults(null);
    try {
      const { technology, controlDeficiencies } = data;

      const { riskStatement } = await generateRiskStatement({ technology, controlDeficiencies });
      const { riskDescription } = await generateRiskDescription({ technology, riskStatement, controlDeficiencies });
      const { likelihood, impact } = await rateRisk({
        technology,
        deficiencies: controlDeficiencies,
        riskStatement,
        riskDescription,
      });

      setResults({
        technology,
        controlDeficiencies,
        riskStatement,
        riskDescription,
        likelihood,
        impact,
        controls: [],
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to generate risk assessment. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="flex items-center justify-center mb-8 text-center">
          <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary mr-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">RiskWise</h1>
        </header>

        <main className="space-y-8">
          <RiskForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          {isLoading && <Loader />}
          {results && <RiskResults data={results} />}
        </main>
      </div>
    </div>
  );
}
