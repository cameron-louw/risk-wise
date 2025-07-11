'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RiskAssessment } from '@/types';
import { Download, FileWarning, ShieldAlert, ClipboardList, Info, Sparkles, X, PlusCircle, Lightbulb, RefreshCw, MessageCircleQuestion, Lock, Shield, ServerCrash, ShieldCheck, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { rateRisk } from '@/ai/flows/rate-risk';
import { ClarifyingQuestions } from './clarifying-questions';
import { generateRiskDescription } from '@/ai/flows/generate-risk-description';
import { generateRiskStatement } from '@/ai/flows/generate-risk-statement';
import { generateSuggestedControls } from '@/ai/flows/generate-suggested-controls';
import { generateClarifyingQuestions } from '@/ai/flows/generate-clarifying-questions';
import { CiaImpactChart } from './cia-impact-chart';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RiskResultsProps {
  initialData: RiskAssessment;
  onStartOver: () => void;
  onAssessmentUpdate: (updatedAssessment: RiskAssessment) => void;
  isSavedView?: boolean;
}

const ratingValueMap: { [key: string]: number } = {
  'Insignificant': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Severe': 5,
};

export function RiskResults({ initialData, onStartOver, onAssessmentUpdate, isSavedView = false }: RiskResultsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentAssessment, setCurrentAssessment] = useState<RiskAssessment>(initialData);
  const [newControl, setNewControl] = useState('');
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  useEffect(() => {
    setCurrentAssessment(initialData);
  }, [initialData]);

  const handleExport = () => {
    const { technology, controlDeficiencies, riskStatement, riskDescription, likelihood, impact } = currentAssessment;
    
    const escapeCsvField = (field: string | object) => {
      const stringified = typeof field === 'object' ? JSON.stringify(field) : String(field || '');
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    
    const headers = ["Technology", "Control Deficiencies", "Risk Statement", "Risk Description", "Likelihood", "Impact"].join(",");
    
    const row = [
      escapeCsvField(technology),
      escapeCsvField(controlDeficiencies),
      escapeCsvField(riskStatement),
      escapeCsvField(riskDescription),
      escapeCsvField(likelihood.rating),
      escapeCsvField(impact.rating)
    ].join(",");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + row;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "riskwise_assessment.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSaveRisk = () => {
    try {
        const savedRisks: RiskAssessment[] = JSON.parse(localStorage.getItem('riskAssessments') || '[]');
        const updatedRisks = [...savedRisks.filter(r => r.id !== currentAssessment.id), currentAssessment];
        localStorage.setItem('riskAssessments', JSON.stringify(updatedRisks));
        toast({
            title: "Risk Saved",
            description: "Your risk assessment has been saved successfully.",
        });
        if (!isSavedView) {
            router.push('/risks');
        }
    } catch (e) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "Failed to save risk",
            description: "Could not save the risk to local storage.",
        });
    }
  };

  const getBadgeVariant = (level: string): 'destructive' | 'secondary' | 'outline' => {
    const lowerLevel = (level || '').toLowerCase();
    if (lowerLevel.includes('severe') || lowerLevel.includes('high') || lowerLevel.includes('critical')) return 'destructive';
    if (lowerLevel.includes('medium')) return 'secondary';
    return 'outline';
  };
  
  const getCellColor = (rating: number): string => {
    if (rating >= 16) return 'bg-red-500/20';
    if (rating >= 10) return 'bg-yellow-500/20';
    if (rating >= 6) return 'bg-yellow-400/20';
    if (rating >= 3) return 'bg-green-400/20';
    return 'bg-green-500/20';
  };

  const getTotalRatingBadgeVariant = (rating: number): 'destructive' | 'secondary' | 'outline' => {
    if (rating >= 16) return 'destructive';
    if (rating >= 6) return 'secondary';
    return 'outline';
  };
  
  const handleAddControl = (controlToAdd?: string) => {
    const control = (controlToAdd || newControl).trim();
    if (control === '') return;
    if ((currentAssessment.controls || []).includes(control)) {
      toast({
        variant: "default",
        title: "Control already added",
        description: "This control is already in the list.",
      });
      return;
    }
    const updatedAssessment = {
        ...currentAssessment,
        controls: [...(currentAssessment.controls || []), control]
    };
    setCurrentAssessment(updatedAssessment);
    onAssessmentUpdate(updatedAssessment);
    setNewControl('');
  };

  const handleRemoveControl = (index: number) => {
    const updatedControls = (currentAssessment.controls || []).filter((_, i) => i !== index);
    const updatedAssessment = { ...currentAssessment, controls: updatedControls };
    setCurrentAssessment(updatedAssessment);
    onAssessmentUpdate(updatedAssessment);
  };
  
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const { technology, controlDeficiencies, controls, clarifyingQuestions, questionAnswers } = currentAssessment;
      
      const qna = (clarifyingQuestions || []).map((q, i) => `${q}\nAnswer: ${questionAnswers?.[i] || 'Not answered'}`).join('\n\n');
      const hasAnswers = (questionAnswers || []).some(a => a.trim() !== '');
      const enrichedDeficiencies = hasAnswers ? `${controlDeficiencies}\n\nAdditional Context from Q&A:\n${qna}` : controlDeficiencies;

      const { riskStatement } = await generateRiskStatement({ technology, controlDeficiencies: enrichedDeficiencies });
      const { riskDescription } = await generateRiskDescription({ technology, riskStatement, controlDeficiencies: enrichedDeficiencies });
      
      const [rateResult, controlsResult, questionsResult] = await Promise.all([
        rateRisk({
          technology,
          deficiencies: enrichedDeficiencies,
          riskStatement,
          riskDescription,
          controls,
        }),
        generateSuggestedControls({
            technology,
            riskStatement,
            riskDescription,
            controlDeficiencies: enrichedDeficiencies,
        }),
        generateClarifyingQuestions({
            technology,
            controlDeficiencies: enrichedDeficiencies
        })
      ]);
      
      const updatedAssessment = { 
        ...currentAssessment,
        riskStatement,
        riskDescription,
        likelihood: rateResult.likelihood, 
        impact: rateResult.impact,
        ciaImpact: rateResult.ciaImpact,
        suggestedControls: controlsResult.suggestedControls,
        clarifyingQuestions: questionsResult.questions,
        questionAnswers: new Array(questionsResult.questions.length).fill('')
      };

      setCurrentAssessment(updatedAssessment);
      onAssessmentUpdate(updatedAssessment);

    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to recalculate risk. Please try again.",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const { initialLikelihood, initialImpact, initialCiaImpact, likelihood, impact, controls, suggestedControls, clarifyingQuestions, questionAnswers, ciaImpact } = currentAssessment;
  
  const residualRating = (ratingValueMap[likelihood.rating] || 0) * (ratingValueMap[impact.rating] || 0) ;
  const inherentRating = initialLikelihood && initialImpact ? (ratingValueMap[initialLikelihood.rating] || 0) * (ratingValueMap[initialImpact.rating] || 0) : residualRating;
  const showInherentRisk = initialLikelihood && initialImpact && (initialLikelihood.rating !== likelihood.rating || initialImpact.rating !== impact.rating);
  
  const hasControls = controls && controls.length > 0;
  const hasSuggestedControls = suggestedControls && suggestedControls.length > 0;
  const hasClarifyingQuestions = clarifyingQuestions && clarifyingQuestions.length > 0;
  
  const hasAnswers = (questionAnswers || []).some(a => !!a?.trim());
  const recalculateText = hasControls || hasAnswers ? 'Recalculate with new information' : 'Recalculate Assessment';
  
  const riskLevels = ['Insignificant', 'Low', 'Medium', 'High', 'Severe'];
  const riskLevelsReversed = [...riskLevels].reverse();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {!isSavedView && (
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <h2 className="text-2xl font-semibold">Assessment Results</h2>
          <div className="flex gap-2">
              <Button onClick={onStartOver} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start New Assessment
              </Button>
              <Button onClick={handleExport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
              </Button>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-accent" />
            <span>Risk Statement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{currentAssessment.riskStatement}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Info className="h-6 w-6 text-accent" />
            <span>Risk Description</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">{currentAssessment.riskDescription}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-accent" />
              <span>Likelihood</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={getBadgeVariant(likelihood.rating)} className="text-base px-4 py-1 rounded-md">
              {likelihood.rating}
            </Badge>
            <Separator orient="horizontal" />
            <p className="text-muted-foreground">{likelihood.justification}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileWarning className="h-6 w-6 text-accent" />
              <span>Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={getBadgeVariant(impact.rating)} className="text-base px-4 py-1 rounded-md">
              {impact.rating}
            </Badge>
            <Separator orient="horizontal" />
            <p className="text-muted-foreground">{impact.justification}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-accent" />
            <span>Risk Matrix</span>
          </CardTitle>
          <CardDescription>
            Comparing inherent risk (before controls) to residual risk (after controls). 
            {showInherentRisk && <span className="inline-block w-3 h-3 bg-muted-foreground/50 rounded-full mx-1.5"></span>}
            {showInherentRisk && "Inherent, "}
            <span className="inline-block w-3 h-3 bg-primary rounded-full mx-1.5"></span> Residual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center w-full">
            <div className="flex-none flex items-center justify-center font-bold -rotate-90">Likelihood</div>
            <div className="flex-grow">
              <div className="grid grid-cols-5 w-full text-center font-bold border-t">
                {riskLevels.map((impactLevel) => (
                  <div key={impactLevel} className="p-2 border-r border-t border-b flex items-center justify-center text-xs sm:text-sm">{impactLevel}</div>
                ))}
              </div>
              {riskLevelsReversed.map((likelihoodLevel) => (
                <div key={likelihoodLevel} className="grid grid-cols-6 w-full text-center border-l">
                  <div className="p-2 border-r border-b flex items-center justify-center font-bold text-xs sm:text-sm">
                    {likelihoodLevel}
                  </div>
                  {riskLevels.map((impactLevel) => {
                    const cellRating = (ratingValueMap[likelihoodLevel] || 0) * (ratingValueMap[impactLevel] || 0);
                    const isResidual = likelihoodLevel === likelihood.rating && impactLevel === impact.rating;
                    const isInherent = showInherentRisk && initialLikelihood && initialImpact && likelihoodLevel === initialLikelihood.rating && impactLevel === initialImpact.rating;
                    
                    return (
                      <div
                        key={`${likelihoodLevel}-${impactLevel}`}
                        className={`relative p-4 border-r border-b flex items-center justify-center text-sm font-bold ${getCellColor(cellRating)}`}
                      >
                        {cellRating || '-'}
                        {isInherent && (
                            <div className="absolute inset-1 ring-2 ring-muted-foreground/50 rounded-full" title={`Inherent Risk (${initialLikelihood?.rating} / ${initialImpact?.rating})`}></div>
                        )}
                        {isResidual && (
                            <div className="absolute inset-1 ring-2 ring-primary rounded-full" title={`Residual Risk (${likelihood.rating} / ${impact.rating})`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full text-center font-bold mt-2">Impact</div>

          <Separator />

          <div className="flex items-center justify-center gap-6">
             {showInherentRisk && (
              <div className="flex items-center gap-2 text-center flex-col">
                <span className="text-lg font-semibold">Inherent Risk</span>
                <Badge variant={getTotalRatingBadgeVariant(inherentRating)} className="text-lg px-4 py-1 rounded-md">
                  {inherentRating}
                </Badge>
              </div>
             )}
            <div className="flex items-center gap-2 text-center flex-col">
              <span className="text-lg font-semibold">Residual Risk</span>
              <Badge variant={getTotalRatingBadgeVariant(residualRating)} className="text-lg px-4 py-1 rounded-md">
                {residualRating}
              </Badge>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Risk ratings explained: 1-5 (Low), 6-15 (Medium), 16-25 (High).
          </div>
        </CardContent>
      </Card>

      {ciaImpact && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-accent" />
                    <span>CIA Triad Impact Analysis</span>
                </CardTitle>
                <CardDescription>Comparing inherent vs residual impact on Confidentiality, Integrity, and Availability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <CiaImpactChart 
                  residual={ciaImpact}
                  inherent={showInherentRisk ? initialCiaImpact : undefined}
                />
                <div className="grid md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                        <h4 className="flex items-center font-semibold text-primary"><Lock className="mr-2 h-5 w-5" />Confidentiality</h4>
                        <Badge variant={getBadgeVariant(ciaImpact.confidentiality.rating)}>{ciaImpact.confidentiality.rating}</Badge>
                        <p className="text-sm text-muted-foreground">{ciaImpact.confidentiality.justification}</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="flex items-center font-semibold text-primary"><Shield className="mr-2 h-5 w-5" />Integrity</h4>
                        <Badge variant={getBadgeVariant(ciaImpact.integrity.rating)}>{ciaImpact.integrity.rating}</Badge>
                        <p className="text-sm text-muted-foreground">{ciaImpact.integrity.justification}</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="flex items-center font-semibold text-primary"><ServerCrash className="mr-2 h-5 w-5" />Availability</h4>
                        <Badge variant={getBadgeVariant(ciaImpact.availability.rating)}>{ciaImpact.availability.rating}</Badge>
                        <p className="text-sm text-muted-foreground">{ciaImpact.availability.justification}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      <Accordion type="multiple" className="w-full space-y-6" defaultValue={["refine-and-recalculate"]}>
        <Card>
            <AccordionItem value="refine-and-recalculate" className="border-0">
                <CardHeader className="pb-2">
                    <AccordionTrigger className="p-0 hover:no-underline">
                        <CardTitle className="flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-accent" />
                            <span>Refine &amp; Recalculate</span>
                        </CardTitle>
                    </AccordionTrigger>
                    <CardDescription>Add mitigating controls or answer clarifying questions to refine the assessment, then click recalculate.</CardDescription>
                </CardHeader>
                <AccordionContent>
                    <CardContent className="space-y-6 pt-4">
                        {hasSuggestedControls && (
                           <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-400" />Suggested Controls</h4>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedControls.map((control, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddControl(control)}
                                        className="flex items-center gap-2 h-auto text-wrap text-left justify-start"
                                    >
                                        <PlusCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{control}</span>
                                    </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Add Mitigating Controls</h4>
                            <div className="flex gap-2">
                                <Input
                                type="text"
                                value={newControl}
                                onChange={(e) => setNewControl(e.target.value)}
                                placeholder="e.g., Implement MFA, Encrypt data at rest"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddControl()}
                                />
                                <Button onClick={() => handleAddControl()} variant="outline" size="icon">
                                <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            {hasControls ? (
                            <>
                                <p className="text-sm font-medium">Applied Mitigating Controls:</p>
                                <ul className="space-y-2">
                                {controls.map((control, index) => (
                                    <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                                    <span>{control}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveControl(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                    </li>
                                ))}
                                </ul>
                            </>
                            ) : (
                            <p className="text-muted-foreground text-sm">No new controls have been added yet.</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleRecalculate} disabled={isRecalculating}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {isRecalculating ? 'Recalculating...' : recalculateText}
                            </Button>
                        </div>
                    </CardContent>
                </AccordionContent>
            </AccordionItem>
        </Card>

        {hasClarifyingQuestions && (
            <Card className="shadow-none border-dashed">
                <AccordionItem value="clarifying-questions" className="border-0">
                     <CardHeader className="pb-2">
                        <AccordionTrigger className="p-0 hover:no-underline">
                             <CardTitle className="flex items-center gap-3">
                                <MessageCircleQuestion className="h-6 w-6 text-primary" />
                                <span>Refine with Q&amp;A</span>
                            </CardTitle>
                        </AccordionTrigger>
                         <CardDescription>Answer these clarifying questions to provide more context and improve the accuracy of the risk assessment when you recalculate.</CardDescription>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent>
                            <ClarifyingQuestions 
                                questions={clarifyingQuestions} 
                                answers={questionAnswers || []}
                                onAnswerChange={(index, answer) => {
                                    const newAnswers = [...(currentAssessment.questionAnswers || [])];
                                    newAnswers[index] = answer;
                                    const updatedAssessment = {...currentAssessment, questionAnswers: newAnswers};
                                    setCurrentAssessment(updatedAssessment);
                                    onAssessmentUpdate(updatedAssessment);
                                }}
                            />
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Card>
        )}
      </Accordion>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveRisk} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {isSavedView ? 'Update Saved Risk' : 'Save Risk & View List'}
        </Button>
      </div>
    </div>
  );
}
