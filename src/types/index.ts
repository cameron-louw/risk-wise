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
  controls?: string[];
};
