'use server';

/**
 * @fileOverview AI flow for generating detailed risk descriptions based on risk statements.
 *
 * - generateRiskDescription - Function to generate risk descriptions.
 * - GenerateRiskDescriptionInput - Input type for the generateRiskDescription function.
 * - GenerateRiskDescriptionOutput - Return type for the generateRiskDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRiskDescriptionInputSchema = z.object({
  technology: z.string().describe('The technology at risk.'),
  riskStatement: z.string().describe('The generated risk statement.'),
  controlDeficiencies: z.string().describe('The control deficiencies associated with the risk.'),
});
export type GenerateRiskDescriptionInput = z.infer<typeof GenerateRiskDescriptionInputSchema>;

const GenerateRiskDescriptionOutputSchema = z.object({
  riskDescription: z.string().describe('A detailed description of the risk, expanding on the statement.'),
});
export type GenerateRiskDescriptionOutput = z.infer<typeof GenerateRiskDescriptionOutputSchema>;

export async function generateRiskDescription(input: GenerateRiskDescriptionInput): Promise<GenerateRiskDescriptionOutput> {
  return generateRiskDescriptionFlow(input);
}

const riskDescriptionPrompt = ai.definePrompt({
  name: 'riskDescriptionPrompt',
  input: {schema: GenerateRiskDescriptionInputSchema},
  output: {schema: GenerateRiskDescriptionOutputSchema},
  prompt: `You are an expert risk analyst. Generate a detailed risk description based on the provided risk statement, technology, and control deficiencies. Provide a clear justification for the risk's relevance and explain how the deficiencies contribute to the risk.

Technology: {{{technology}}}
Risk Statement: {{{riskStatement}}}
Control Deficiencies: {{{controlDeficiencies}}}

Risk Description:`, 
});

const generateRiskDescriptionFlow = ai.defineFlow(
  {
    name: 'generateRiskDescriptionFlow',
    inputSchema: GenerateRiskDescriptionInputSchema,
    outputSchema: GenerateRiskDescriptionOutputSchema,
  },
  async input => {
    const {output} = await riskDescriptionPrompt(input);
    return output!;
  }
);
