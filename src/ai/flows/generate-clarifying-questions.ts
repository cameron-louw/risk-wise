'use server';

/**
 * @fileOverview AI flow for generating clarifying questions to better understand a risk.
 *
 * - generateClarifyingQuestions - Function to generate questions.
 * - GenerateClarifyingQuestionsInput - Input type for the function.
 * - GenerateClarifyingQuestionsOutput - Return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateClarifyingQuestionsInputSchema = z.object({
  technology: z.string().describe('The technology at risk.'),
  controlDeficiencies: z.string().describe('The initial description of control deficiencies.'),
});
export type GenerateClarifyingQuestionsInput = z.infer<typeof GenerateClarifyingQuestionsInputSchema>;

const GenerateClarifyingQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of 3-5 clarifying questions to better understand the context of the risk.'),
});
export type GenerateClarifyingQuestionsOutput = z.infer<typeof GenerateClarifyingQuestionsOutputSchema>;

export async function generateClarifyingQuestions(input: GenerateClarifyingQuestionsInput): Promise<GenerateClarifyingQuestionsOutput> {
  return generateClarifyingQuestionsFlow(input);
}

const clarifyingQuestionsPrompt = ai.definePrompt({
  name: 'clarifyingQuestionsPrompt',
  input: { schema: GenerateClarifyingQuestionsInputSchema },
  output: { schema: GenerateClarifyingQuestionsOutputSchema },
  prompt: `You are an expert risk analyst. Based on the provided technology and control deficiencies, generate 3-5 concise, targeted questions to gather more specific information needed for a thorough risk assessment. The questions should help clarify ambiguity, understand the environment, and determine the potential impact.

Technology: {{{technology}}}
Control Deficiencies: {{{controlDeficiencies}}}

Generate questions that will help you better assess the likelihood and impact of the potential risk.
`,
});

const generateClarifyingQuestionsFlow = ai.defineFlow(
  {
    name: 'generateClarifyingQuestionsFlow',
    inputSchema: GenerateClarifyingQuestionsInputSchema,
    outputSchema: GenerateClarifyingQuestionsOutputSchema,
  },
  async input => {
    const { output } = await clarifyingQuestionsPrompt(input);
    return output!;
  }
);
