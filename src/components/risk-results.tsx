'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RiskAssessment } from '@/types';
import { Download, FileWarning, ShieldAlert, ClipboardList, Info, Sparkles, X, PlusCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { rateRisk } from '@/ai/flows/rate-risk';

interface RiskResultsProps {
  data: RiskAssessment;
  onStartOver: () => void;
}

const likelihoodLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const impactLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

const ratingValueMap: { [key: string]: number } = {
  'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5,
};

export function RiskResults({ data, onStartOver }: RiskResultsProps) {
  const { toast } = useToast();
  const [currentAssessment, setCurrentAssessment] = useState<RiskAssessment>(data);
  const [newControl, setNewControl] = useState('');
  const [isRecalculating, setIsRecalculating] = useState(false);
  
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

  const getBadgeVariant = (level: string): 'destructive' | 'secondary' | 'outline' => {
    const lowerLevel = (level || '').toLowerCase();
    if (lowerLevel.includes('very high') || lowerLevel.includes('high')) return 'destructive';
    if (lowerLevel.includes('medium')) return 'secondary';
    return 'outline';
  };
  
  const getCellColor = (rating: number): string => {
    if (rating >= 16) return 'bg-red-500/50';
    if (rating >= 10) return 'bg-yellow-500/50';
    if (rating >= 6) return 'bg-yellow-400/50';
    if (rating >= 3) return 'bg-green-400/50';
    return 'bg-green-500/50';
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
    const updatedControls = [...(currentAssessment.controls || []), control];
    setCurrentAssessment({ ...currentAssessment, controls: updatedControls });
    setNewControl('');
  };

  const handleRemoveControl = (index: number) => {
    const updatedControls = (currentAssessment.controls || []).filter((_, i) => i !== index);
    setCurrentAssessment({ ...currentAssessment, controls: updatedControls });
  };
  
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const { technology, controlDeficiencies, riskStatement, riskDescription, controls } = currentAssessment;
      const result = await rateRisk({
        technology,
        deficiencies: controlDeficiencies,
        riskStatement,
        riskDescription,
        controls,
      });
      setCurrentAssessment({ ...currentAssessment, likelihood: result.likelihood, impact: result.impact });
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

  const { likelihood, impact, controls, suggestedControls } = currentAssessment;
  const totalRating = (ratingValueMap[likelihood.rating] || 0) * (ratingValueMap[impact.rating] || 0) ;
  const hasControls = controls && controls.length > 0;
  const hasSuggestedControls = suggestedControls && suggestedControls.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
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
          <CardDescription>Understanding your risk level based on likelihood and impact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="grid grid-cols-6 w-full text-center font-bold border-l border-t">
              <div className="p-2 border-r border-b flex items-center justify-center"></div>
              {impactLevels.slice().reverse().map((impactLevel) => (
                <div key={impactLevel} className="p-2 border-r border-b flex items-center justify-center">{impactLevel}</div>
              ))}
            </div>
            {likelihoodLevels.slice().reverse().map((likelihoodLevel) => (
              <div key={likelihoodLevel} className="grid grid-cols-6 w-full text-center border-l border-b">
                <div className="p-2 border-r flex items-center justify-center font-bold">
                  {likelihoodLevel}
                </div>
                {impactLevels.map((impactLevel) => {
                  const cellRating = (ratingValueMap[likelihoodLevel] || 0) * (ratingValueMap[impactLevel] || 0);
                  const isHighlighted = likelihoodLevel === likelihood.rating && impactLevel === impact.rating;
                  return (
                    <div
                      key={`${likelihoodLevel}-${impactLevel}`}
                      className={`p-4 border-r border-b flex items-center justify-center text-sm ${getCellColor(cellRating)} ${isHighlighted ? 'ring-4 ring-blue-500 z-10' : ''}`}
                    >
                      {cellRating || '-'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-center gap-4">
            <span className="text-lg font-semibold">Total Risk Rating:</span>
            <Badge variant={getTotalRatingBadgeVariant(totalRating)} className="text-lg px-4 py-1 rounded-md">
              {totalRating}
            </Badge>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Risk ratings explained: 1-5 (Low), 6-15 (Medium), 16-25 (High).
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Info className="h-6 w-6 text-accent" />
            <span>Add Mitigating Controls</span>
          </CardTitle>
          <CardDescription>Add controls to see how they impact the risk assessment, then click recalculate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasSuggestedControls && (
            <div className="space-y-3">
              <h4 className="flex items-center text-sm font-semibold">
                <Lightbulb className="mr-2 h-4 w-4 text-yellow-400" />
                <span>Suggested Controls</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestedControls.map((control, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddControl(control)}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {control}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
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
            <div className="flex justify-end pt-2">
              <Button onClick={handleRecalculate} disabled={isRecalculating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isRecalculating ? 'Recalculating...' : hasControls ? 'Recalculate with Controls' : 'Recalculate Assessment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
