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
  controls: z.array(z.string()).optional().describe('Implemented controls that mitigate the risk.'),
});
export type RateRiskInput = z.infer<typeof RateRiskInputSchema>;

const RateRiskOutputSchema = z.object({
  likelihood: z.object({
    rating: z.string().describe('The likelihood of the risk occurring (e.g., Low, Medium, High).'),
    justification: z.string().describe('A detailed justification for the likelihood rating.'),
  }),
  impact: z.object({
    rating: z.string().describe('The impact if the risk occurs (e.g., Low, Medium, High).'),
    justification: z.string().describe('A detailed justification for the impact rating.'),
  }),
});
export type RateRiskOutput = z.infer<typeof RateRiskOutputSchema>

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
{{#if controls}}
Implemented Controls:
{{#each controls}}
- {{{this}}}
{{/each}}
{{/if}}

Provide a likelihood rating (Low, Medium, High) and a detailed justification for this rating based on a security risk framework. Explain WHY the rating is what it is.
Provide an impact rating (Low, Medium, High) and a detailed justification for this rating based on a security risk framework. Explain WHY the rating is what it is.
Ensure that the ratings are based on the severity and probability implied by the deficiencies and risk descriptions.
If controls are implemented, explain how they affect the likelihood and/or impact.
Use a security risk framework (e.g., FAIR, NIST SP 800-30) to inform your justifications.
`,
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
