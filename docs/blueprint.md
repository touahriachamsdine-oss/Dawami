# **App Name**: AtProfit HR

## Core Features:

- User Authentication and Roles: Secure authentication using Firebase Authentication, distinguishing between 'Admin' and 'Employee' roles. Admins manage employee accounts, while employees access attendance and salary details.
- Attendance Tracking: Employees check in/out using a button or QR code, updating attendance records in real-time. The system calculates 'Late' or 'Absent' status automatically, triggering salary deductions as configured.
- Automated Salary Calculation Tool: Admin-configured rules drive monthly salary calculations via Cloud Functions. The LLM tool computes deductions based on attendance and dynamically updates total salaries.
- Admin Dashboard: Comprehensive admin interface providing employee overviews, attendance rates, salary costs, and employee data editing capabilities. Export data as CSV or PDF.
- Employee Dashboard: Personalized dashboards displaying attendance calendars, monthly salary summaries, and absence/deduction notifications. Profile management included.
- Settings Management: Admin interface to set and adjust pay cut rates within the Firestore settings collection.
- Multi-Language Support: Enable app internationalization with support for English, Arabic, and French to cater to a diverse user base.

## Style Guidelines:

- Primary color: Soft purple (#7469B6), evoking professionalism.
- Background color: Very light pink (#FFE6E6), to soften the appearance of the dashboard.
- Accent color: Lilac (#AD88C6), used for interactive elements, buttons, and highlights.
- Body and headline font: 'PT Sans' (sans-serif) provides a modern and clean look suitable for both headlines and body text.
- Consistent and professional icon set for navigation and data visualization, providing intuitive interaction cues.
- Dashboard layout using cards for key metrics, tables for data, and a responsive design to ensure compatibility across devices. Navigation includes a mobile-friendly sidebar and a light/dark mode toggle.
- Subtle transition animations and loading states to enhance user experience and guide interactions.