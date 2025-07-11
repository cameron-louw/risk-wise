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
  deficiencies: z.string().describe('The control deficiencies identified, possibly with additional context from user answers.'),
  riskStatement: z.string().describe('The generated risk statement.'),
  riskDescription: z.string().describe('The generated risk description.'),
  controls: z.array(z.string()).optional().describe('Implemented controls that mitigate the risk.'),
});
export type RateRiskInput = z.infer<typeof RateRiskInputSchema>;

const ratingScale = z.enum(['Very Low', 'Low', 'Medium', 'High', 'Very High']);
const ciaRatingScale = z.enum(['Low', 'Medium', 'High', 'Critical']);

const CiaImpactSchema = z.object({
  rating: ciaRatingScale.describe('The impact rating for this CIA component (Low, Medium, High, Critical).'),
  justification: z.string().describe('A detailed justification for the rating.'),
});

const RateRiskOutputSchema = z.object({
  likelihood: z.object({
    rating: ratingScale.describe('The likelihood of the risk occurring (Very Low, Low, Medium, High, Very High).'),
    justification: z.string().describe('A detailed justification for the likelihood rating based on the FAIR framework.'),
  }),
  impact: z.object({
    rating: ratingScale.describe('The impact if the risk occurs (Very Low, Low, Medium, High, Very High).'),
    justification: z.string().describe('A detailed justification for the impact rating based on the FAIR framework.'),
  }),
  ciaImpact: z.object({
    confidentiality: CiaImpactSchema,
    integrity: CiaImpactSchema,
    availability: CiaImpactSchema,
  }).describe('An analysis of the impact on the Confidentiality, Integrity, and Availability (CIA) triad.'),
});
export type RateRiskOutput = z.infer<typeof RateRiskOutputSchema>

export async function rateRisk(input: RateRiskInput): Promise<RateRiskOutput> {
  return rateRiskFlow(input);
}

const rateRiskPrompt = ai.definePrompt({
  name: 'rateRiskPrompt',
  input: {schema: RateRiskInputSchema},
  output: {schema: RateRiskOutputSchema},
  prompt: `You are a Senior Risk Analyst using the Factor Analysis of Information Risk (FAIR) framework. Your task is to assess the likelihood and impact of a described risk scenario.

**Risk Context:**
- **Technology:** {{{technology}}}
- **Control Deficiencies & Context:** {{{deficiencies}}}
- **Risk Statement:** {{{riskStatement}}}
- **Risk Description:** {{{riskDescription}}}

{{#if controls}}
**Mitigating Controls Implemented:**
{{#each controls}}
- {{{this}}}
{{/each}}
{{/if}}

**Assessment Instructions:**

1.  **Analyze Likelihood:**
    -   Based on the deficiencies and any additional context, determine the Threat Event Frequency (how often a threat agent will act) and Vulnerability (how easily the technology can be compromised).
    -   If mitigating controls are present, evaluate how they reduce Threat Event Frequency or Vulnerability.
    -   Provide a **Likelihood Rating** on a scale of **Very Low, Low, Medium, High, Very High**.
    -   Provide a detailed **Justification** for your likelihood rating, explaining your reasoning based on FAIR principles (Threat Event Frequency, Vulnerability) and the effect of any controls.

2.  **Analyze Impact:**
    -   Based on the risk description, estimate the potential magnitude of loss (e.g., financial, reputational, legal).
    -   Consider the different forms of loss (Productivity, Response, Replacement, Fines and Judgements, Competitive Advantage, Reputation).
    -   If mitigating controls are present, evaluate how they reduce the magnitude of loss.
    -   Provide an **Impact Rating** on a scale of **Very Low, Low, Medium, High, Very High**.
    -   Provide a detailed **Justification** for your impact rating, explaining your reasoning based on FAIR principles (Magnitude of Loss) and the effect of any controls.

3.  **Analyze CIA Triad Impact:**
    -   Assess the impact of the risk on the three pillars of the CIA triad.
    -   **Confidentiality:** How does this risk affect the privacy and secrecy of data? (Unauthorized disclosure)
    -   **Integrity:** How does this risk affect the trustworthiness and accuracy of data? (Unauthorized modification or destruction)
    -   **Availability:** How does this risk affect access to the system and data? (Disruption of access)
    -   For each of the three pillars, provide a **Rating** on a scale of **Low, Medium, High, Critical** and a detailed **Justification** for your rating.

Your response must be in the specified JSON format.
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
