
'use client';
import { useState, useEffect } from 'react';
import { Scanner as QR } from '@yudiel/react-qr-scanner';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useFirebase, collection, addDoc, serverTimestamp, query, where, getDocs, limit } from '@/db';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/language-provider';

export function QrScanner() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { firestore, user } = useFirebase();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: t('clockIn.cameraDeniedTitle'),
          description: t('clockIn.cameraDeniedDesc'),
        });
      }
    };

    getCameraPermission();
  }, [toast, t]);

  const getTimestampSlot = () => {
    const now = Date.now();
    const interval = 90 * 60 * 1000;
    return Math.floor(now / interval);
  };

  const handleDecode = async (result: string) => {
    if (!isScanning) return;
    setIsScanning(false);

    try {
      const parts = result.split('|');
      if (parts.length !== 3 || parts[0] !== 'atprofit-clock-in') {
        throw new Error(t('clockIn.invalidQr'));
      }

      const employeeId = parts[1].split('=')[1];
      const timestampSlot = parseInt(parts[2].split('=')[1], 10);
      const currentTimestampSlot = getTimestampSlot();

      if (employeeId !== user?.uid) {
        throw new Error(t('clockIn.notYourQr'));
      }

      if (timestampSlot !== currentTimestampSlot) {
        throw new Error(t('clockIn.qrExpired'));
      }

      if (!firestore || !user) throw new Error(t('clockIn.authError'));

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const attendanceRef = collection(firestore, 'users', user.uid, 'attendance');
      const q = query(attendanceRef, where('date', '==', todayStr), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error(t('clockIn.alreadyClockedIn'));
      }

      await addDoc(attendanceRef, {
        date: todayStr,
        checkInTime: serverTimestamp(),
        status: 'Present',
      });

      toast({
        title: t('clockIn.success'),
        description: t('clockIn.successDesc', { time: new Date().toLocaleTimeString() }),
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('clockIn.fail'),
        description: error.message || "An unexpected error occurred.",
      });
      setTimeout(() => setIsScanning(true), 3000);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner Error:', error);
    if (isScanning) {
      toast({
        variant: "destructive",
        title: t('clockIn.scanError'),
        description: t('clockIn.scanErrorDesc'),
      });
    }
  };

  if (hasCameraPermission === null) {
    return <div className="flex justify-center items-center h-48"><p>{t('clockIn.cameraPermission')}</p></div>
  }

  return (
    <div className='relative w-full aspect-square max-w-sm mx-auto'>
      {hasCameraPermission ? (
        <QR
          onDecode={handleDecode}
          onError={handleError}
          constraints={{
            facingMode: 'environment'
          }}
          styles={{
            container: { width: '100%', paddingTop: '100%', position: 'relative' },
            video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius)' },
          }}
        />
      ) : (
        <Alert variant="destructive">
          <AlertTitle>{t('clockIn.cameraDeniedTitle')}</AlertTitle>
          <AlertDescription>
            {t('clockIn.cameraDeniedDesc')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
