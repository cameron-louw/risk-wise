export type RiskRating = {
  rating: string;
  justification: string;
};

export type CiaImpactRating = {
  rating: string;
  justification: string;
};

export type CiaImpact = {
  confidentiality: CiaImpactRating;
  integrity: CiaImpactRating;
  availability: CiaImpactRating;
};

export type RiskAssessment = {
  id: string; // Unique identifier for each risk
  technology: string;
  controlDeficiencies: string;
  riskStatement: string;
  riskDescription: string;
  
  // Inherent risk (before controls)
  initialLikelihood?: RiskRating;
  initialImpact?: RiskRating;
  initialCiaImpact?: CiaImpact;

  // Residual risk (after controls)
  likelihood: RiskRating;
  impact: RiskRating;
  ciaImpact: CiaImpact;

  controls?: string[];
  suggestedControls?: string[];
  clarifyingQuestions?: string[];
  questionAnswers?: string[];
};
