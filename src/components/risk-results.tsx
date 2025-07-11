'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RiskAssessment } from '@/types';
import { Download, FileWarning, ShieldAlert, ClipboardList, Info } from 'lucide-react';

interface RiskResultsProps {
  data: RiskAssessment;
}

export function RiskResults({ data }: RiskResultsProps) {
  const handleExport = () => {
    const { technology, controlDeficiencies, riskStatement, riskDescription, likelihood, impact } = data;
    
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
    if (lowerLevel.startsWith('high')) return 'destructive';
    if (lowerLevel.startsWith('medium')) return 'secondary';
    return 'outline';
  };

  const parseRating = (text: string) => {
    if (!text) return { rating: 'N/A', justification: 'Not available.' };
    const parts = text.split(/ - |: /);
    const rating = parts[0] || 'N/A';
    const justification = parts.length > 1 ? parts.slice(1).join(' - ') : 'No justification provided.';
    return { rating, justification };
  };

  const { rating: likelihoodRating, justification: likelihoodJustification } = parseRating(data.likelihood);
  const { rating: impactRating, justification: impactJustification } = parseRating(data.impact);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">Assessment Results</h2>
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
          <p className="text-lg font-medium">{data.riskStatement}</p>
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
          <p className="whitespace-pre-wrap leading-relaxed">{data.riskDescription}</p>
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
            <Separator />
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
            <Separator />
            <p className="text-muted-foreground">{impactJustification}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
