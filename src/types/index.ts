export type RiskAssessment = {
  technology: string;
  controlDeficiencies: string;
  riskStatement: string;
  riskDescription: string;
  likelihood: {
    rating: string;
    justification: string;
  };
  impact: {
    rating: string;
    justification: string;
  };
  ciaImpact: {
    confidentiality: { rating: string; justification: string; };
    integrity: { rating: string; justification: string; };
    availability: { rating: string; justification: string; };
  };
  controls?: string[];
  suggestedControls?: string[];
  clarifyingQuestions?: string[];
  questionAnswers?: string[];
};
