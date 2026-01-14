'use server';

/**
 * @fileOverview A flow for generating personalized absence notifications for employees.
 *
 * - generateAbsenceNotification - A function that generates personalized absence notifications.
 * - AbsenceNotificationInput - The input type for the generateAbsenceNotification function.
 * - AbsenceNotificationOutput - The return type for the generateAbsenceNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AbsenceNotificationInputSchema = z.object({
  employeeName: z.string().describe('The name of the employee.'),
  daysAbsent: z.number().describe('The number of days the employee has been absent.'),
  payCutRate: z.number().describe('The percentage of pay cut per missed day.'),
  deductionAmount: z.number().describe('The amount deducted from the employee\'s salary.'),
});
export type AbsenceNotificationInput = z.infer<typeof AbsenceNotificationInputSchema>;

const AbsenceNotificationOutputSchema = z.object({
  notificationText: z.string().describe('The personalized notification text for the employee.'),
});
export type AbsenceNotificationOutput = z.infer<typeof AbsenceNotificationOutputSchema>;

export async function generateAbsenceNotification(input: AbsenceNotificationInput): Promise<AbsenceNotificationOutput> {
  return generateAbsenceNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'absenceNotificationPrompt',
  input: {schema: AbsenceNotificationInputSchema},
  output: {schema: AbsenceNotificationOutputSchema},
  prompt: `You are an HR communication specialist. Generate a personalized notification for an employee who has been absent.

  Employee Name: {{{employeeName}}}
  Days Absent: {{{daysAbsent}}}
  Pay Cut Rate: {{{payCutRate}}}%
  Deduction Amount: {{{deductionAmount}}}

  Notification Text:`, //Just generate notification text, nothing else
});

const generateAbsenceNotificationFlow = ai.defineFlow(
  {
    name: 'generateAbsenceNotificationFlow',
    inputSchema: AbsenceNotificationInputSchema,
    outputSchema: AbsenceNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
