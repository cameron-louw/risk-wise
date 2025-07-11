'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { type RiskAssessment } from '@/types';
import { RiskResults } from '@/components/risk-results';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

export default function RiskDetailPage() {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      try {
        const savedRisks: RiskAssessment[] = JSON.parse(localStorage.getItem('riskAssessments') || '[]');
        const foundRisk = savedRisks.find(r => r.id === id);
        if (foundRisk) {
          setAssessment(foundRisk);
        }
      } catch (error) {
        console.error("Failed to load risk from local storage", error);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  const handleAssessmentUpdate = (updatedAssessment: RiskAssessment) => {
    setAssessment(updatedAssessment);
    // Also update it in localStorage
    try {
      const savedRisks: RiskAssessment[] = JSON.parse(localStorage.getItem('riskAssessments') || '[]');
      const riskIndex = savedRisks.findIndex(r => r.id === updatedAssessment.id);
      if (riskIndex !== -1) {
        savedRisks[riskIndex] = updatedAssessment;
        localStorage.setItem('riskAssessments', JSON.stringify(savedRisks));
      }
    } catch (error) {
      console.error("Failed to update risk in local storage", error);
    }
  };
  
  const startOver = () => {
    router.push('/');
  }

  if (loading) {
    return <Loader text="Loading Risk Assessment..." />;
  }
  
  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold">Risk Not Found</h2>
        <p>The requested risk assessment could not be found.</p>
        <Link href="/risks" className="mt-4">
          <Button>Back to Risk List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-background p-4 sm:p-8">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Link href="/risks">
          <Button variant="outline">
            <ListChecks className="mr-2 h-4 w-4" />
            View All Risks
          </Button>
        </Link>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl mx-auto">
        <header className="flex items-center justify-center mb-8 text-center">
          <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary mr-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">Risk Details</h1>
        </header>

        <main className="space-y-8">
          <RiskResults
            initialData={assessment}
            onStartOver={startOver}
            onAssessmentUpdate={handleAssessmentUpdate}
            isSavedView={true}
          />
        </main>
      </div>
    </div>
  );
}
