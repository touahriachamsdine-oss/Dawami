import { config } from 'dotenv';
config();

import '@/ai/flows/generate-absence-notifications.ts';
import '@/ai/flows/generate-job-descriptions.ts';
import '@/ai/flows/summarize-attendance.ts';
