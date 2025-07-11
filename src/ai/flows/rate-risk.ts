'use server';

/**
 * @fileOverview AI-driven risk assessment for likelihood and impact based on control deficiencies.
 *
 * - rateRisk - A function to assess risk likelihood and impact.
 * - RateRiskInput - The input type for the rateRisk function.
 * - RateRiskOutput - The return type for the rateRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RateRiskInputSchema = z.object({
  technology: z.string().describe('The technology associated with the risk.'),
  deficiencies: z.string().describe('The control deficiencies identified.'),
  riskStatement: z.string().describe('The generated risk statement.'),
  riskDescription: z.string().describe('The generated risk description.'),
});
export type RateRiskInput = z.infer<typeof RateRiskInputSchema>;

const RateRiskOutputSchema = z.object({
  likelihood: z
    .string()
    .describe(
      'The likelihood of the risk occurring (Low, Medium, High), with justification.'
    ),
  impact:
    z.string().describe('The impact if the risk occurs (Low, Medium, High), with justification.'),
});
export type RateRiskOutput = z.infer<typeof RateRiskOutputSchema>;

export async function rateRisk(input: RateRiskInput): Promise<RateRiskOutput> {
  return rateRiskFlow(input);
}

const rateRiskPrompt = ai.definePrompt({
  name: 'rateRiskPrompt',
  input: {schema: RateRiskInputSchema},
  output: {schema: RateRiskOutputSchema},
  prompt: `Based on the following technology, control deficiencies, risk statement, and risk description, assess the likelihood and impact of the risk.

Technology: {{{technology}}}
Deficiencies: {{{deficiencies}}}
Risk Statement: {{{riskStatement}}}
Risk Description: {{{riskDescription}}}

Provide a likelihood rating (Low, Medium, High) with a justification.
Provide an impact rating (Low, Medium, High) with a justification.

Ensure that the ratings are based on the severity and probability implied by the deficiencies and risk descriptions.

Likelihood: // Rating and justification here
Impact: // Rating and justification here`,
});

const rateRiskFlow = ai.defineFlow(
  {
    name: 'rateRiskFlow',
    inputSchema: RateRiskInputSchema,
    outputSchema: RateRiskOutputSchema,
  },
  async input => {
    const {output} = await rateRiskPrompt(input);
    return output!;
  }
);
