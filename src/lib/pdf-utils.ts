import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generatePaySlip(employee: any, month: string) {
    const doc = new jsPDF() as any;
    const companyName = "Dawami";
    const companyAddress = "Dawami Headquarters, Algeria";

    // Header
    doc.setFontSize(22);
    doc.text(companyName, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(companyAddress, 105, 27, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(16);
    doc.text(`FICHE DE PAIE - ${month}`, 105, 45, { align: 'center' });

    // Employee Info
    doc.setFontSize(10);
    doc.text(`Nom de l'employe: ${employee.employeeName}`, 20, 60);
    doc.text(`Poste: ${employee.jobTitle}`, 20, 67);
    doc.text(`Matricule: #${employee.userId.slice(-6)}`, 20, 74);
    doc.text(`Date d'impression: ${new Date().toLocaleDateString()}`, 140, 60);

    // Table
    const tableData = [
        ['Libelle', 'Nombre', 'Taux', 'Gains (DZD)', 'Retenues (DZD)'],
        ['Salaire de Base', employee.isHourBased ? employee.hoursWorked : employee.daysWorked, employee.hourlyRate, employee.calculations.baseSalary.toFixed(2), ''],
        ['Prime de Transport', '-', '-', employee.transportAllowance.toFixed(2), ''],
        ['Prime de Zone', '-', '-', employee.zoneAllowance.toFixed(2), ''],
        ['Prime d\'Anciennete', '-', '-', employee.seniorityAllowance.toFixed(2), ''],
        ['Allocations Familiales', '-', '-', employee.familyAllowance.toFixed(2), ''],
        ['Autres Indemnites', '-', '-', employee.otherAllowance.toFixed(2), ''],
        ['CNAS (9%)', '-', '9.00%', '', employee.calculations.cnas.toFixed(2)],
        ['IRG', '-', 'Progressive', '', employee.calculations.irg.toFixed(2)],
    ];

    doc.autoTable({
        startY: 90,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFont("Helvetica", "bold");
    doc.text(`Salaire Brut:`, 120, finalY);
    doc.text(`${employee.calculations.grossSalary.toFixed(2)} DZD`, 190, finalY, { align: 'right' });

    doc.text(`Total Retenues:`, 120, finalY + 7);
    doc.text(`${(employee.calculations.cnas + employee.calculations.irg).toFixed(2)} DZD`, 190, finalY + 7, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text(`NET A PAYER:`, 120, finalY + 17);
    doc.text(`${employee.calculations.netSalary.toFixed(2)} DZD`, 190, finalY + 17, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Cachet et Signature", 150, finalY + 40);
    doc.line(140, finalY + 55, 180, finalY + 55);

    doc.save(`PaySlip_${employee.employeeName.replace(/\s+/g, '_')}_${month}.pdf`);
}
