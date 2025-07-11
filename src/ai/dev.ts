import { config } from 'dotenv';
config();

import '@/ai/flows/generate-risk-statement.ts';
import '@/ai/flows/generate-risk-description.ts';
import '@/ai/flows/rate-risk.ts';
import '@/ai/flows/generate-suggested-controls.ts';
