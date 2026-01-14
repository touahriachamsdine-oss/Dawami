'use client';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { User } from '@/lib/types';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

// Function to get a time slot based on a 90-minute interval
const getTimestampSlot = () => {
  const now = Date.now();
  const interval = 90 * 60 * 1000; // 90 minutes in milliseconds
  return Math.floor(now / interval);
};

export function EmployeeQrCodeGenerator({ employee }: { employee: User }) {
  const [qrValue, setQrValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const generateQrValue = () => {
    const timestampSlot = getTimestampSlot();
    return `atprofit-clock-in|employeeId=${employee.uid}|timestamp=${timestampSlot}`;
  };

  useEffect(() => {
    if (isOpen) {
      const initialValue = generateQrValue();
      setQrValue(initialValue);

      const intervalId = setInterval(() => {
        setQrValue(generateQrValue());
      }, 90 * 60 * 1000); // Refresh every 90 minutes

      return () => clearInterval(intervalId);
    }
  }, [isOpen, employee.uid]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Show QR Code</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Clock-In Code for {employee.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {qrValue ? (
            <QRCode
              value={qrValue}
              size={200}
              bgColor={"hsl(var(--background))"}
              fgColor={"hsl(var(--foreground))"}
              level={"H"}
              includeMargin={true}
            />
          ) : (
            <div className="h-[200px] w-[200px] flex items-center justify-center bg-muted rounded-md">
              <p>Generating QR Code...</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            This code is unique and refreshes periodically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
