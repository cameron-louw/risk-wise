'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RiskAssessment } from '@/types';
import { Download, FileWarning, ShieldAlert, ClipboardList, Info } from 'lucide-react';

import { rateRisk } from '@/ai/flows/rate-risk';
interface RiskResultsProps {
  data: RiskAssessment;
}

const likelihoodLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const impactLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

const ratingValueMap: { [key: string]: number } = {
  'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5,
};

export function RiskResults({ data }: RiskResultsProps) {
  const [currentAssessment, setCurrentAssessment] = useState<RiskAssessment>(data);
  const [newControl, setNewControl] = useState('');

  const handleExport = () => {
    const { technology, controlDeficiencies, riskStatement, riskDescription, likelihood, impact } = currentAssessment;
    
    const escapeCsvField = (field: string) => `"${String(field || '').replace(/"/g, '""')}"`;
    
    const headers = ["Technology", "Control Deficiencies", "Risk Statement", "Risk Description", "Likelihood", "Impact"].join(",");
    
    const row = [
      escapeCsvField(technology),
      escapeCsvField(controlDeficiencies),
      escapeCsvField(riskStatement),
      escapeCsvField(riskDescription),
      escapeCsvField(likelihood),
      escapeCsvField(impact)
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
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.startsWith('very high') || lowerLevel.startsWith('high')) return 'destructive';
    if (lowerLevel.startsWith('medium')) return 'secondary';
    if (lowerLevel.startsWith('low') || lowerLevel.startsWith('very low')) return 'outline';
    return 'outline'; // Default case
  };
  const getCellColor = (rating: number): string => {
    if (rating >= 16) return 'bg-red-500/50'; // Very High Risk
    if (rating >= 10) return 'bg-red-400/50'; // High Risk
    if (rating >= 6) return 'bg-orange-300/50'; // Medium-High Risk
    if (rating >= 3) return 'bg-yellow-300/50'; // Medium Risk
    return 'outline';
  };
  const getTotalRatingBadgeVariant = (rating: number): 'destructive' | 'secondary' | 'outline' => {
    if (rating >= 15) return 'destructive'; // High
    if (rating >= 5) return 'secondary'; // Medium
    return 'outline'; // Low
  };

  const handleAddControl = async () => {
    if (newControl.trim() === '') return;

    const updatedControls = currentAssessment.controls ? [...currentAssessment.controls, newControl.trim()] : [newControl.trim()];

    const updatedAssessment = await rateRisk({
      ...currentAssessment,
      controls: updatedControls,
    });

    setCurrentAssessment({ ...currentAssessment, ...updatedAssessment, controls: updatedControls });
    setNewControl('');
  };

  const parseRating = (text: string) => {
    if (!text) return { rating: 'N/A', justification: 'Rating or justification not available. Provide more details or add controls for better assessment.' };
    const parts = text.split(/ - |: /);
    const rating = parts[0] || 'N/A';
    const justification = parts.length > 1 ? parts.slice(1).join(' - ') : 'No justification provided.';
    return { rating, justification };
  };

  const { rating: likelihoodRating, justification: likelihoodJustification } = parseRating(data.likelihood);
  const { rating: impactRating, justification: impactJustification } = parseRating(currentAssessment.impact);
  const totalRating = (ratingValueMap[likelihoodRating] || 0) * (ratingValueMap[impactRating] || 0) ;


  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-2xl font-semibold">Assessment Results</h2>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
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
            <Badge variant={getBadgeVariant(likelihoodRating)} className="text-base px-4 py-1 rounded-md">
              {likelihoodRating}
            </Badge>
            <Separator orient="horizontal" />
            <p className="text-muted-foreground">{likelihoodJustification}</p>
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
            <Badge variant={getBadgeVariant(impactRating)} className="text-base px-4 py-1 rounded-md">
              {impactRating}
            </Badge>
            <Separator orient="horizontal" />
            <p className="text-muted-foreground">{impactJustification}</p>
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
          {/* Risk Matrix */}
          <div className="flex flex-col items-center justify-center w-full">
            {/* Impact Header (Top) */}
            <div className="grid grid-cols-6 w-full text-center font-bold border-l border-t">
              {/* Corner empty cell */}
              <div className="p-2 border-r border-b flex items-center justify-center"></div>
              {/* Impact Levels (Left to Right) */}
              {impactLevels.reverse().map((impactLevel, i) => (
                <div key={impactLevel} className="p-2 border-r border-b flex items-center justify-center">{impactLevel}</div>
              ))}
            </div>
            {/* Likelihood Levels (Left side, Top to Bottom) and Matrix Cells */}
            {likelihoodLevels.reverse().map((likelihoodLevel, lIndex) => (
              <div key={likelihoodLevel} className="grid grid-cols-6 w-full text-center border-l border-b"> {/* Added border-b here */}
                {/* Likelihood Label (Leftmost column in each row) */}
                <div className="p-2 border-r flex items-center justify-center font-bold">
 {likelihoodLevel} ({ratingValueMap[likelihoodLevel]})
                </div>
                {/* Matrix Cells for this Likelihood level */}
                {impactLevels.map((impactLevel, iIndex) => {
                  const cellRating = (ratingValueMap[likelihoodLevel] || 0) * (ratingValueMap[impactLevel] || 0); // Calculate cellRating within the correct scope
                  const isHighlighted = likelihoodLevel === likelihoodRating && impactLevel === impactRating; // Check if this cell should be highlighted
                  return (
                    <div
                      key={`${likelihoodLevel}-${impactLevel}`} // Unique key for each cell
                      className={`p-4 border-r border-b flex items-center justify-center text-sm ${getCellColor(cellRating)} ${isHighlighted ? 'ring-4 ring-blue-500 z-10' : ''}`} // Apply cell color and highlight class
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
            Risk ratings explained: 1-4 (Very Low), 5-9 (Low), 10-15 (Medium), 16-20 (High), 21-25 (Very High).
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Info className="h-6 w-6 text-accent" />
            <span>Implemented Controls</span>
          </CardTitle>
          <CardDescription>Add controls to see how they impact the risk assessment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentAssessment.controls && currentAssessment.controls.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {currentAssessment.controls.map((control, index) => (
                <li key={index}>{control}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No controls have been added yet.</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newControl}
              onChange={(e) => setNewControl(e.target.value)}
              placeholder="Add a control (e.g., Backups, Encryption)"
              className="flex-grow px-3 py-2 border rounded-md text-sm"
            />
            <Button onClick={handleAddControl}>Add Control</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
