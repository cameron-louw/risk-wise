'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type RiskAssessment } from '@/types';
import { PlusCircle, Trash2, ArrowUpRight, ListChecks, ShieldCheck, Eye } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const ratingValueMap: { [key: string]: number } = {
    'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5,
};

export default function RiskListPage() {
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const router = useRouter();

  useEffect(() => {
    const savedRisks = JSON.parse(localStorage.getItem('riskAssessments') || '[]');
    setRisks(savedRisks);
  }, []);
  
  const deleteRisk = (id: string) => {
    const updatedRisks = risks.filter(risk => risk.id !== id);
    localStorage.setItem('riskAssessments', JSON.stringify(updatedRisks));
    setRisks(updatedRisks);
  };
  
  const viewRisk = (id: string) => {
    router.push(`/risks/${id}`);
  };

  const getTotalRatingBadgeVariant = (rating: number): 'destructive' | 'secondary' | 'outline' => {
    if (rating >= 16) return 'destructive';
    if (rating >= 6) return 'secondary';
    return 'outline';
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-background p-4 sm:p-8">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <ThemeToggle />
        </div>
        <div className="w-full max-w-6xl mx-auto">
            <header className="flex items-center justify-center mb-8 text-center">
                <ListChecks className="w-8 h-8 md:w-10 md:h-10 text-primary mr-3" />
                <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">Saved Risks</h1>
            </header>

            <main>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Risk Register</CardTitle>
                            <CardDescription>A list of all the risks you have saved.</CardDescription>
                        </div>
                        <Link href="/">
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Assessment
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {risks.length > 0 ? (
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[20%]">Technology</TableHead>
                                    <TableHead>Risk Statement</TableHead>
                                    <TableHead className="text-center">Likelihood</TableHead>
                                    <TableHead className="text-center">Impact</TableHead>
                                    <TableHead className="text-center">Total Rating</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {risks.map((risk) => {
                                    const totalRating = (ratingValueMap[risk.likelihood.rating] || 0) * (ratingValueMap[risk.impact.rating] || 0);
                                    return (
                                        <TableRow key={risk.id}>
                                            <TableCell className="font-medium">{risk.technology}</TableCell>
                                            <TableCell>{risk.riskStatement}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{risk.likelihood.rating}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{risk.impact.rating}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={getTotalRatingBadgeVariant(totalRating)}>{totalRating}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => viewRisk(risk.id)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteRisk(risk.id); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <ShieldCheck className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-semibold">No risks saved yet</h3>
                                <p className="mt-2 text-sm">Start a new assessment to begin tracking risks.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    </div>
  );
}
