'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

const formSchema = z.object({
  technology: z.string().min(2, { message: 'Technology name must be at least 2 characters.' }),
  controlDeficiencies: z.string().min(10, { message: 'Please provide a detailed description of control deficiencies (at least 10 characters).' }),
});

type RiskFormValues = z.infer<typeof formSchema>;

interface RiskFormProps {
  onSubmit: (data: RiskFormValues) => void;
  isLoading: boolean;
}

export function RiskForm({ onSubmit, isLoading }: RiskFormProps) {
  const form = useForm<RiskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      technology: '',
      controlDeficiencies: '',
    },
    mode: 'onChange',
  });

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle>New Risk Assessment</CardTitle>
        <CardDescription>Enter the technology and its control deficiencies to start the AI-powered risk assessment process.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="technology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technology Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cloud-based CRM Platform" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the system, application, or technology being assessed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="controlDeficiencies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Control Deficiencies</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Lack of multi-factor authentication for admin accounts.\nNo regular review of user access rights."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List the weaknesses or gaps in security controls. Please be descriptive.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !form.formState.isValid} size="lg">
                <BrainCircuit className="mr-2 h-5 w-5" />
                {isLoading ? 'Generating...' : 'Generate Assessment'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}