// Summarize attendance data at the end of each month.
'use server';
/**
 * @fileOverview Summarizes employee attendance data to provide insights into attendance trends.
 *
 * - summarizeAttendance - A function that summarizes the attendance data.
 * - SummarizeAttendanceInput - The input type for the summarizeAttendance function.
 * - SummarizeAttendanceOutput - The return type for the summarizeAttendance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAttendanceInputSchema = z.object({
  attendanceData: z
    .string()
    .describe('A string containing the employee attendance data.'),
  payCutRate: z.number().describe('The pay cut rate for each missed day.'),
});
export type SummarizeAttendanceInput = z.infer<typeof SummarizeAttendanceInputSchema>;

const SummarizeAttendanceOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the employee attendance data, including trends and potential issues.'),
  totalPayCut: z
    .number()
    .describe('The total pay cut amount based on the attendance data and pay cut rate.'),
});
export type SummarizeAttendanceOutput = z.infer<typeof SummarizeAttendanceOutputSchema>;

export async function summarizeAttendance(input: SummarizeAttendanceInput): Promise<SummarizeAttendanceOutput> {
  return summarizeAttendanceFlow(input);
}

const summarizeAttendancePrompt = ai.definePrompt({
  name: 'summarizeAttendancePrompt',
  input: {schema: SummarizeAttendanceInputSchema},
  output: {schema: SummarizeAttendanceOutputSchema},
  prompt: `You are an HR data analyst. You will be provided with employee attendance data for the month and the pay cut rate for each missed day.

  Based on this data, generate a summary of the attendance trends and any potential issues, and the total pay cut amount.

  Attendance Data: {{{attendanceData}}}
  Pay Cut Rate: {{{payCutRate}}}

  Respond in a professional tone.
  Ensure that the summary includes key metrics such as the average attendance rate, the number of employees with perfect attendance, and the number of employees with excessive absences.  Also list the names of employees with excessive absences.
`,
});

const summarizeAttendanceFlow = ai.defineFlow(
  {
    name: 'summarizeAttendanceFlow',
    inputSchema: SummarizeAttendanceInputSchema,
    outputSchema: SummarizeAttendanceOutputSchema,
  },
  async input => {
    const {output} = await summarizeAttendancePrompt(input);
    return output!;
  }
);
