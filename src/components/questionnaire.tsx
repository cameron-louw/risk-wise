'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, BrainCircuit } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

interface QuestionnaireProps {
  questions: string[];
  answers: string[];
  setAnswers: (answers: string[]) => void;
  onSubmit: (answers: string[]) => void;
  isLoading: boolean;
}

export function Questionnaire({ questions, answers, setAnswers, onSubmit, isLoading }: QuestionnaireProps) {
  const form = useForm();

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const allQuestionsAnswered = answers.every(answer => answer.trim() !== '');

  const handleFormSubmit = () => {
    onSubmit(answers);
  };

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-primary" />
            <span>Clarifying Questions</span>
        </CardTitle>
        <CardDescription>To provide a more accurate assessment, please answer the following questions.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !allQuestionsAnswered} size="lg">
                <BrainCircuit className="mr-2 h-5 w-5" />
                {isLoading ? 'Generating...' : 'Generate Full Assessment'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
