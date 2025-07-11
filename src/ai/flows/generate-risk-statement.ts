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
  controlDeficiencies: z.string().describe('The control deficiencies of the technology.'),
});
export type GenerateRiskStatementInput = z.infer<typeof GenerateRiskStatementInputSchema>;

const GenerateRiskStatementOutputSchema = z.object({
  riskStatement: z.string().describe('The generated risk statement.'),
});
export type GenerateRiskStatementOutput = z.infer<typeof GenerateRiskStatementOutputSchema>;

export async function generateRiskStatement(input: GenerateRiskStatementInput): Promise<GenerateRiskStatementOutput> {
  return generateRiskStatementFlow(input);
}

const hasMultipleDeficienciesTool = ai.defineTool({
  name: 'hasMultipleDeficiencies',
  description: 'Determines if there are multiple control deficiencies.',
  inputSchema: z.object({
    controlDeficiencies: z.string().describe('The control deficiencies to check.'),
  }),
  outputSchema: z.boolean(),
}, async (input) => {
  const deficiencies = input.controlDeficiencies.split(/\r?\n/).filter(deficiency => deficiency.trim() !== '');
  return deficiencies.length > 1;
});

const prompt = ai.definePrompt({
  name: 'generateRiskStatementPrompt',
  input: {schema: GenerateRiskStatementInputSchema},
  output: {schema: GenerateRiskStatementOutputSchema},
  tools: [hasMultipleDeficienciesTool],
  prompt: `Given the technology and its control deficiencies, generate a concise risk statement.

Technology: {{{technology}}}
Control Deficiencies: {{{controlDeficiencies}}}

Generate a concise risk statement in the following format: "a [threat actor] [risk event] which leads to [impact]".

Consider whether the risk has one or multiple control deficiencies using the hasMultipleDeficiencies tool.

Risk Statement: `,
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
