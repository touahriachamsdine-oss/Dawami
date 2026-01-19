
export interface SalaryGridEntry {
    category: string;
    minIndex: number;
    echelonIndices: number[];
}

export const SALARY_GRID_2007: SalaryGridEntry[] = [
    { category: "1", minIndex: 200, echelonIndices: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120] },
    { category: "2", minIndex: 219, echelonIndices: [11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121, 132] },
    { category: "3", minIndex: 240, echelonIndices: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144] },
    { category: "4", minIndex: 263, echelonIndices: [13, 26, 39, 53, 66, 79, 92, 105, 118, 132, 145, 158] },
    { category: "5", minIndex: 288, echelonIndices: [14, 29, 43, 58, 72, 86, 101, 115, 130, 144, 158, 173] },
    { category: "6", minIndex: 315, echelonIndices: [16, 32, 47, 63, 79, 95, 110, 126, 142, 158, 173, 189] },
    { category: "7", minIndex: 348, echelonIndices: [17, 35, 52, 70, 87, 104, 122, 139, 157, 174, 191, 209] },
    { category: "8", minIndex: 379, echelonIndices: [19, 38, 57, 76, 95, 114, 133, 152, 171, 190, 208, 227] },
    { category: "9", minIndex: 418, echelonIndices: [21, 42, 63, 84, 105, 125, 146, 167, 188, 209, 230, 251] },
    { category: "10", minIndex: 453, echelonIndices: [23, 45, 68, 91, 113, 136, 159, 181, 204, 227, 249, 272] },
    { category: "11", minIndex: 498, echelonIndices: [25, 50, 75, 100, 125, 149, 174, 199, 224, 249, 274, 299] },
    { category: "12", minIndex: 537, echelonIndices: [27, 54, 81, 107, 134, 161, 188, 215, 242, 269, 295, 322] },
    { category: "13", minIndex: 578, echelonIndices: [29, 58, 87, 116, 145, 173, 202, 231, 260, 289, 318, 347] },
    { category: "14", minIndex: 621, echelonIndices: [31, 62, 93, 124, 155, 186, 217, 248, 279, 311, 342, 373] },
    { category: "15", minIndex: 666, echelonIndices: [33, 67, 100, 133, 167, 200, 233, 266, 300, 333, 366, 400] },
    { category: "16", minIndex: 713, echelonIndices: [36, 71, 107, 143, 178, 214, 250, 285, 321, 357, 392, 428] },
    { category: "17", minIndex: 762, echelonIndices: [38, 76, 114, 152, 191, 229, 267, 305, 343, 381, 419, 457] },
];

export const INDEX_POINT_VALUE_2007 = 45;

export function calculateBaseSalary2007(category: string, echelon: number): number {
    const entry = SALARY_GRID_2007.find(e => e.category === category);
    if (!entry) return 0;

    const echelonIndex = echelon > 0 ? entry.echelonIndices[echelon - 1] || 0 : 0;
    const totalIndex = entry.minIndex + echelonIndex;

    return totalIndex * INDEX_POINT_VALUE_2007;
}
