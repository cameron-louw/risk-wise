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
  );
}
