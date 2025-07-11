'use server';

/**
 * @fileOverview AI flow for generating suggested mitigating controls based on a risk assessment.
 *
 * - generateSuggestedControls - Function to generate control suggestions.
 * - GenerateSuggestedControlsInput - Input type for the generateSuggestedControls function.
 * - GenerateSuggestedControlsOutput - Return type for the generateSuggestedControls function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSuggestedControlsInputSchema = z.object({
  technology: z.string().describe('The technology at risk.'),
  riskStatement: z.string().describe('The generated risk statement.'),
  riskDescription: z.string().describe('The detailed risk description.'),
  controlDeficiencies: z.string().describe('The control deficiencies associated with the risk.'),
});
export type GenerateSuggestedControlsInput = z.infer<typeof GenerateSuggestedControlsInputSchema>;

const GenerateSuggestedControlsOutputSchema = z.object({
  suggestedControls: z.array(z.string()).describe('A list of 3-5 practical, real-world mitigating controls.'),
});
export type GenerateSuggestedControlsOutput = z.infer<typeof GenerateSuggestedControlsOutputSchema>;

export async function generateSuggestedControls(input: GenerateSuggestedControlsInput): Promise<GenerateSuggestedControlsOutput> {
  return generateSuggestedControlsFlow(input);
}

const suggestControlsPrompt = ai.definePrompt({
  name: 'suggestControlsPrompt',
  input: {schema: GenerateSuggestedControlsInputSchema},
  output: {schema: GenerateSuggestedControlsOutputSchema},
  prompt: `You are an expert risk management consultant. Based on the provided risk assessment details, suggest a list of 3-5 practical and actionable mitigating controls. The controls should be based on real-world best practices (e.g., NIST, CIS) and directly address the identified deficiencies.

Technology: {{{technology}}}
Risk Statement: {{{riskStatement}}}
Risk Description: {{{riskDescription}}}
Control Deficiencies: {{{controlDeficiencies}}}

Provide a list of concise, actionable control suggestions.
`, 
});

const generateSuggestedControlsFlow = ai.defineFlow(
  {
    name: 'generateSuggestedControlsFlow',
    inputSchema: GenerateSuggestedControlsInputSchema,
    outputSchema: GenerateSuggestedControlsOutputSchema,
  },
  async input => {
    const {output} = await suggestControlsPrompt(input);
    return output!;
  }
);
