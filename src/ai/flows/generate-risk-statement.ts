// src/ai/flows/generate-risk-statement.ts
'use server';

/**
 * @fileOverview Generates a risk statement based on the technology and its control deficiencies.
 *
 * - generateRiskStatement - A function that generates a risk statement.
 * - GenerateRiskStatementInput - The input type for the generateRiskStatement function.
 * - GenerateRiskStatementOutput - The return type for the generateRiskStatement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRiskStatementInputSchema = z.object({
  technology: z.string().describe('The technology at risk.'),
  controlDeficiencies: z.string().describe('The control deficiencies of the technology, possibly with additional user-provided context.'),
});
export type GenerateRiskStatementInput = z.infer<typeof GenerateRiskStatementInputSchema>;

const GenerateRiskStatementOutputSchema = z.object({
  riskStatement: z.string().describe('The generated risk statement.'),
});
export type GenerateRiskStatementOutput = z.infer<typeof GenerateRiskStatementOutputSchema>;

export async function generateRiskStatement(input: GenerateRiskStatementInput): Promise<GenerateRiskStatementOutput> {
  return generateRiskStatementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRiskStatementPrompt',
  input: {schema: GenerateRiskStatementInputSchema},
  output: {schema: GenerateRiskStatementOutputSchema},
  prompt: `Given the technology and its control deficiencies (which may include answers to clarifying questions), generate a concise risk statement.

Technology: {{{technology}}}
Control Deficiencies and Context: {{{controlDeficiencies}}}

Generate a concise risk statement that describes a potential threat scenario.
`,
});

const generateRiskStatementFlow = ai.defineFlow(
  {
    name: 'generateRiskStatementFlow',
    inputSchema: GenerateRiskStatementInputSchema,
    outputSchema: GenerateRiskStatementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
