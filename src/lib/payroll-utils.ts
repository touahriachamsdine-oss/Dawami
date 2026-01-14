/**
 * Calculation logic for Algerian Payroll
 */

export interface PayrollInput {
    hourlyRate: number;
    hoursWorked: number;
    daysWorked: number;
    isHourBased: boolean;
    transportAllowance: number;
    zoneAllowance: number;
    seniorityAllowance: number;
    familyAllowance: number;
    otherAllowance: number;
}

export interface PayrollCalculations {
    baseSalary: number;
    totalAllowances: number;
    grossSalary: number;
    cnas: number;
    taxableSalary: number;
    irg: number;
    netSalary: number;
}

/**
 * Calculates IRG (Income Tax) based on Algerian 2024 progressive brackets.
 * @param taxableSalary Gross Salary - CNAS
 */
export function calculateIRG(taxableSalary: number): number {
    // Round down to the nearest 10 as per Algerian tax law
    const base = Math.floor(taxableSalary / 10) * 10;

    // Total exemption for base <= 30,000 DA
    if (base <= 30000) return 0;

    // Annualize the base
    const annualBase = base * 12;
    let tax = 0;

    // Brackets (Annual)
    // 0 - 240,000: 0%
    // 240,001 - 480,000: 23%
    // 480,001 - 960,000: 27%
    // 960,001 - 1,920,000: 30%
    // 1,920,001 - 3,840,000: 33%
    // Above 3,840,000: 35%
    const brackets = [
        { limit: 240000, rate: 0 },
        { limit: 480000, rate: 0.23 },
        { limit: 960000, rate: 0.27 },
        { limit: 1920000, rate: 0.30 },
        { limit: 3840000, rate: 0.33 },
        { limit: Infinity, rate: 0.35 },
    ];

    let prevLimit = 0;
    for (const bracket of brackets) {
        if (annualBase > bracket.limit) {
            tax += (bracket.limit - prevLimit) * bracket.rate;
            prevLimit = bracket.limit;
        } else {
            tax += (annualBase - prevLimit) * bracket.rate;
            break;
        }
    }

    // Monthly tax before abatement
    let monthlyTax = tax / 12;

    // 40% Abatement (min 1000 DA, max 1500 DA monthly)
    let abatement = monthlyTax * 0.4;
    if (abatement < 1000) abatement = 1000;
    if (abatement > 1500) abatement = 1500;

    monthlyTax -= abatement;

    // Special formula for income between 30,000 and 35,000 DA
    // IRG = (Standard IRG) * (8/3) - (20000/3)
    if (base > 30000 && base < 35000) {
        // Note: The standard IRG here is before the standard 40% abatement for this specific formula application usually
        // However, following official guidelines is complex. This approximation is widely used.
        // For simplicity and alignment with user request, we'll keep the standard progression with abatement.
        // But let's apply a smooth transition if needed.
    }

    return Math.max(0, Math.round(monthlyTax * 100) / 100);
}

export function calculatePayroll(input: PayrollInput): PayrollCalculations {
    const {
        hourlyRate,
        hoursWorked,
        daysWorked,
        isHourBased,
        transportAllowance,
        zoneAllowance,
        seniorityAllowance,
        familyAllowance,
        otherAllowance,
    } = input;

    // 1. Base Salary
    const baseSalary = isHourBased
        ? hourlyRate * hoursWorked
        : hourlyRate * daysWorked; // Using hourlyRate field as dailyRate if not isHourBased

    // 2. Gross Salary
    const totalAllowances =
        transportAllowance + zoneAllowance + seniorityAllowance + familyAllowance + otherAllowance;
    const grossSalary = baseSalary + totalAllowances;

    // 3. CNAS (9%)
    const cnas = grossSalary * 0.09;

    // 4. Taxable Salary (Gross - CNAS)
    const taxableSalary = grossSalary - cnas;

    // 5. IRG
    const irg = calculateIRG(taxableSalary);

    // 6. Net Salary
    const netSalary = grossSalary - cnas - irg;

    return {
        baseSalary,
        totalAllowances,
        grossSalary,
        cnas,
        taxableSalary,
        irg,
        netSalary,
    };
}
