'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Save,
    Plus,
    Trash2,
    Download,
    FileText,
    Calculator,
    Loader2,
    UserPlus
} from 'lucide-react';
import { calculatePayroll, PayrollInput, PayrollCalculations } from '@/lib/payroll-utils';
import {
    upsertPayrollRecord,
    getPayrollRecords,
    getEmployeesForPayroll,
    deletePayrollRecord
} from '@/lib/actions/payroll-actions';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from '@/lib/language-provider';
import { generatePaySlip } from '@/lib/pdf-utils';

interface PayrollRow extends PayrollInput {
    id?: string;
    userId: string;
    employeeName: string;
    jobTitle: string;
    calculations: PayrollCalculations;
    hasTransport: boolean;
    hasZone: boolean;
    hasSeniority: boolean;
    hasFamily: boolean;
    hasOther: boolean;
    otherAllowanceName: string;
    isModified?: boolean;
}

export default function PayrollGrid({ currentMonth }: { currentMonth: string }) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [data, setData] = useState<PayrollRow[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentMonth]);

    async function loadData() {
        setLoading(true);
        try {
            const [records, allEmployees] = await Promise.all([
                getPayrollRecords(currentMonth),
                getEmployeesForPayroll()
            ]);

            setEmployees(allEmployees);

            const rows: PayrollRow[] = records.map((r: any) => {
                const input: PayrollInput = {
                    hourlyRate: r.hourlyRate,
                    hoursWorked: r.hoursWorked,
                    daysWorked: r.daysWorked,
                    isHourBased: r.isHourBased,
                    transportAllowance: r.transportAllowance,
                    zoneAllowance: r.zoneAllowance,
                    seniorityAllowance: r.seniorityAllowance,
                    familyAllowance: r.familyAllowance,
                    otherAllowance: r.otherAllowance,
                };

                return {
                    id: r.id,
                    userId: r.userId,
                    employeeName: r.user.name,
                    jobTitle: r.jobTitle || r.user.rank || 'Employee',
                    ...input,
                    calculations: calculatePayroll(input),
                    hasTransport: r.transportAllowance > 0,
                    hasZone: r.zoneAllowance > 0,
                    hasSeniority: r.seniorityAllowance > 0,
                    hasFamily: r.familyAllowance > 0,
                    hasOther: r.otherAllowance > 0,
                    otherAllowanceName: r.otherAllowanceName || 'Other',
                    isModified: false,
                };
            });

            setData(rows);
        } catch (error) {
            toast({
                title: t('payroll.messages.errorLoading'),
                description: t('payroll.messages.errorLoadingDesc'),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateField = (index: number, field: keyof PayrollRow, value: any) => {
        const newData = [...data];
        const row = { ...newData[index], [field]: value };

        const inputFields: (keyof PayrollInput)[] = [
            'hourlyRate', 'hoursWorked', 'daysWorked', 'isHourBased',
            'transportAllowance', 'zoneAllowance', 'seniorityAllowance',
            'familyAllowance', 'otherAllowance'
        ];

        if (inputFields.includes(field as any) || field.toString().startsWith('has')) {
            if (field === 'hasTransport' && !value) row.transportAllowance = 0;
            if (field === 'hasZone' && !value) row.zoneAllowance = 0;
            if (field === 'hasSeniority' && !value) row.seniorityAllowance = 0;
            if (field === 'hasFamily' && !value) row.familyAllowance = 0;
            if (field === 'hasOther' && !value) row.otherAllowance = 0;

            row.calculations = calculatePayroll(row);
        }

        row.isModified = true;
        newData[index] = row;
        setData(newData);
    };

    const handleSaveRow = async (index: number) => {
        setSaving(true);
        const row = data[index];
        try {
            const result = await upsertPayrollRecord({
                id: row.id,
                userId: row.userId,
                month: currentMonth,
                jobTitle: row.jobTitle,
                hourlyRate: row.hourlyRate,
                hoursWorked: row.hoursWorked,
                daysWorked: row.daysWorked,
                isHourBased: row.isHourBased,
                baseSalary: row.calculations.baseSalary,
                transportAllowance: row.transportAllowance,
                zoneAllowance: row.zoneAllowance,
                seniorityAllowance: row.seniorityAllowance,
                familyAllowance: row.familyAllowance,
                otherAllowance: row.otherAllowance,
                otherAllowanceName: row.otherAllowanceName,
                grossSalary: row.calculations.grossSalary,
                cnas: row.calculations.cnas,
                irg: row.calculations.irg,
                netSalary: row.calculations.netSalary,
            });

            if (result.success) {
                const newData = [...data];
                newData[index].isModified = false;
                setData(newData);
                toast({
                    title: t('payroll.messages.saved'),
                    description: t('payroll.messages.updated', { name: row.employeeName })
                });
            }
        } catch (error) {
            toast({
                title: t('payroll.messages.errorSave'),
                description: t('payroll.messages.errorSaveDesc'),
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAddEmployee = (emp: any) => {
        if (data.find(d => d.userId === emp.id)) {
            toast({
                title: t('payroll.messages.alreadyAdded'),
                description: t('payroll.messages.alreadyAddedDesc')
            });
            return;
        }

        const input: PayrollInput = {
            hourlyRate: emp.baseSalary / 173.33 || 0,
            hoursWorked: 173.33,
            daysWorked: 22,
            isHourBased: true,
            transportAllowance: 0,
            zoneAllowance: 0,
            seniorityAllowance: 0,
            familyAllowance: 0,
            otherAllowance: 0,
        };

        const newRow: PayrollRow = {
            userId: emp.id,
            employeeName: emp.name,
            jobTitle: emp.rank || 'Employee',
            ...input,
            calculations: calculatePayroll(input),
            hasTransport: false,
            hasZone: false,
            hasSeniority: false,
            hasFamily: false,
            hasOther: false,
            otherAllowanceName: 'Other',
            isModified: true,
        };

        setData([...data, newRow]);
    };

    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            gross: acc.gross + row.calculations.grossSalary,
            cnas: acc.cnas + row.calculations.cnas,
            irg: acc.irg + row.calculations.irg,
            net: acc.net + row.calculations.netSalary,
        }), { gross: 0, cnas: 0, irg: 0, net: 0 });
    }, [data]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <UserPlus className="mr-2 h-4 w-4" />
                                {t('payroll.addEmployee')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{t('payroll.selectEmployee')}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                    {employees.map(emp => (
                                        <div
                                            key={emp.id}
                                            className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                            onClick={() => handleAddEmployee(emp)}
                                        >
                                            <div>
                                                <div className="font-medium">{emp.name}</div>
                                                <div className="text-xs text-muted-foreground">{emp.rank}</div>
                                            </div>
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: t('payroll.messages.comingSoon'), description: t('payroll.messages.exportNotice') })}>
                        <Download className="mr-2 h-4 w-4" /> {t('payroll.exportCsv')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        data.forEach(row => generatePaySlip(row, currentMonth));
                        toast({ title: t('payroll.messages.success'), description: t('payroll.messages.pdfNotice') });
                    }}>
                        <FileText className="mr-2 h-4 w-4" /> {t('payroll.pdfSlips')}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[180px]">{t('payroll.table.employee')}</TableHead>
                            <TableHead className="w-[100px]">{t('payroll.table.basis')}</TableHead>
                            <TableHead className="w-[120px]">{t('payroll.table.rate')}</TableHead>
                            <TableHead className="w-[100px]">{t('payroll.table.hoursDays')}</TableHead>
                            <TableHead>{t('payroll.table.allowances')}</TableHead>
                            <TableHead className="text-right">{t('payroll.table.gross')}</TableHead>
                            <TableHead className="text-right">{t('payroll.table.cnas')}</TableHead>
                            <TableHead className="text-right">{t('payroll.table.irg')}</TableHead>
                            <TableHead className="text-right font-bold text-primary">{t('payroll.table.netPay')}</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                    {t('payroll.table.noEmployees')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, idx) => (
                                <TableRow key={idx} className={row.isModified ? "bg-primary/5" : ""}>
                                    <TableCell>
                                        <div className="font-medium text-sm">{row.employeeName}</div>
                                        <Input
                                            className="h-7 text-[10px] mt-1"
                                            value={row.jobTitle}
                                            onChange={(e) => handleUpdateField(idx, 'jobTitle', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Checkbox
                                                id={`hour-${idx}`}
                                                checked={row.isHourBased}
                                                onCheckedChange={(checked) => handleUpdateField(idx, 'isHourBased', !!checked)}
                                            />
                                            <label htmlFor={`hour-${idx}`} className="text-xs">{row.isHourBased ? t('payroll.table.hourly') : t('payroll.table.daily')}</label>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="h-8 text-right font-mono"
                                            value={row.hourlyRate}
                                            onChange={(e) => handleUpdateField(idx, 'hourlyRate', parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="h-8 text-right font-mono"
                                            value={row.isHourBased ? row.hoursWorked : row.daysWorked}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                handleUpdateField(idx, row.isHourBased ? 'hoursWorked' : 'daysWorked', val);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <AllowanceItem
                                                label={t('payroll.allowances.transport')}
                                                active={row.hasTransport}
                                                onTypeToggle={(v: boolean) => handleUpdateField(idx, 'hasTransport', v)}
                                                value={row.transportAllowance}
                                                onChange={(v: number) => handleUpdateField(idx, 'transportAllowance', v)}
                                            />
                                            <AllowanceItem
                                                label={t('payroll.allowances.zone')}
                                                active={row.hasZone}
                                                onTypeToggle={(v: boolean) => handleUpdateField(idx, 'hasZone', v)}
                                                value={row.zoneAllowance}
                                                onChange={(v: number) => handleUpdateField(idx, 'zoneAllowance', v)}
                                            />
                                            <AllowanceItem
                                                label={t('payroll.allowances.seniority')}
                                                active={row.hasSeniority}
                                                onTypeToggle={(v: boolean) => handleUpdateField(idx, 'hasSeniority', v)}
                                                value={row.seniorityAllowance}
                                                onChange={(v: number) => handleUpdateField(idx, 'seniorityAllowance', v)}
                                            />
                                            <AllowanceItem
                                                label={t('payroll.allowances.family')}
                                                active={row.hasFamily}
                                                onTypeToggle={(v: boolean) => handleUpdateField(idx, 'hasFamily', v)}
                                                value={row.familyAllowance}
                                                onChange={(v: number) => handleUpdateField(idx, 'familyAllowance', v)}
                                            />
                                            <AllowanceItem
                                                label={t('payroll.allowances.other')}
                                                active={row.hasOther}
                                                onTypeToggle={(v: boolean) => handleUpdateField(idx, 'hasOther', v)}
                                                value={row.otherAllowance}
                                                onChange={(v: number) => handleUpdateField(idx, 'otherAllowance', v)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {row.calculations.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-red-500">
                                        {row.calculations.cnas.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-red-500">
                                        {row.calculations.irg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm font-bold text-green-600 dark:text-green-400">
                                        {row.calculations.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-500"
                                                disabled={!row.isModified || saving}
                                                onClick={() => handleSaveRow(idx)}
                                            >
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={async () => {
                                                    if (row.id) {
                                                        await deletePayrollRecord(row.id);
                                                    }
                                                    const newData = [...data];
                                                    newData.splice(idx, 1);
                                                    setData(newData);
                                                    toast({
                                                        title: t('payroll.messages.removed'),
                                                        description: t('payroll.messages.removedDesc')
                                                    });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-primary"
                                                title="Export PDF"
                                                onClick={() => generatePaySlip(row, currentMonth)}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    {data.length > 0 && (
                        <TableFooter className="bg-muted/80 backdrop-blur-sm sticky bottom-0">
                            <TableRow>
                                <TableCell colSpan={5} className="font-bold text-right pt-4 pb-4">{t('payroll.table.totals')}</TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                    {totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-red-500">
                                    {totals.cnas.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-red-500">
                                    {totals.irg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-green-600 dark:text-green-400">
                                    {totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>

            <div className="flex justify-end gap-2">
                {data.some(d => d.isModified) && (
                    <p className="text-xs text-amber-500 flex items-center mr-4">
                        <Calculator className="h-3 w-3 mr-1" /> {t('payroll.messages.unsavedChanges')}
                    </p>
                )}
                <Button
                    disabled={!data.some(d => d.isModified) || saving}
                    onClick={async () => {
                        setSaving(true);
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].isModified) {
                                await handleSaveRow(i);
                            }
                        }
                        setSaving(false);
                    }}
                >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {t('payroll.messages.saveAll')}
                </Button>
            </div>
        </div>
    );
}

function AllowanceItem({ label, active, onTypeToggle, value, onChange }: any) {
    return (
        <div className="flex items-center gap-1 mb-1">
            <Checkbox checked={active} onCheckedChange={onTypeToggle} className="h-3 w-3" />
            <span className="text-[10px] w-8 truncate">{label}</span>
            <Input
                type="number"
                className="h-6 w-16 p-1 text-[10px] text-right font-mono"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                disabled={!active}
            />
        </div>
    );
}
