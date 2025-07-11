'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircleQuestion } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

interface ClarifyingQuestionsProps {
  questions: string[];
  answers: string[];
  onAnswerChange: (index: number, value: string) => void;
}

export function ClarifyingQuestions({ questions, answers, onAnswerChange }: ClarifyingQuestionsProps) {
  const form = useForm();
  
  return (
    <Card className="shadow-none border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
            <MessageCircleQuestion className="h-6 w-6 text-primary" />
            <span>Refine Assessment</span>
        </CardTitle>
        <CardDescription>Answer these clarifying questions to provide more context and improve the accuracy of the risk assessment when you recalculate.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form className="space-y-6">
            {questions.map((question, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`question_${index}`}
                render={() => (
                  <FormItem>
                    <FormLabel>{`Question ${index + 1}: ${question}`}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your detailed answer here..."
                        className="min-h-[100px]"
                        value={answers[index]}
                        onChange={(e) => onAnswerChange(index, e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
