
'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { BottomNavBar } from '@/components/ui/bottom-nav-bar';
import { useLanguage } from '@/lib/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Fingerprint,
    Wifi,
    RefreshCcw,
    Code,
    CheckCircle2,
    XCircle,
    Clock,
    CircleUser,
    Copy,
    Check
} from 'lucide-react';
import { getSensorStatus } from '@/lib/actions/sensor-actions';
import { useFirebase } from '@/db';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SensorPage() {
    const { t, language } = useLanguage();
    const { user: authUser, auth } = useFirebase();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const data = await getSensorStatus();
            setStatus(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const esp32Code = `
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-app.vercel.app/api/attendance/fingerprint";
const char* statusUrl = "https://your-app.vercel.app/api/sensor/update";
const char* secret = "YOUR_SENSOR_SECRET";

// Fingerprint Sensor
#define mySerial Serial2
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi Connected");

  finger.begin(57600);
  if (finger.verifyPassword()) {
    Serial.println("Fingerprint sensor found!");
    updateStatus("Online", "Fingerprint sensor active and waiting...");
  } else {
    Serial.println("Did not find fingerprint sensor :(");
    updateStatus("Error", "Sensor hardware not found.");
  }
}

void loop() {
  int id = getFingerprintID();
  if (id > 0) {
    sendAttendance(id);
    delay(2000);
  }
  delay(50);
}

void updateStatus(String status, String msg) {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(statusUrl);
    http.addHeader("Content-Type", "application/json");
    String body = "{\\"status\\":\\"" + status + "\\",\\"message\\":\\"" + msg + "\\",\\"secret\\":\\"" + secret + "\\"\\}";
    int httpResponseCode = http.POST(body);
    http.end();
  }
}

void sendAttendance(int id) {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String body = "{\\"fingerprintId\\":\\"" + String(id) + "\\",\\"secret\\":\\"" + secret + "\\"\\}";
    int httpResponseCode = http.POST(body);
    if (httpResponseCode > 0) {
      Serial.println("Attendance Sent: " + String(httpResponseCode));
    }
    http.end();
  }
}

int getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK)  return -1;

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return -1;

  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK) return -1;
  
  return finger.fingerID;
}
    `.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(esp32Code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isOnline = status?.status === 'Online';
    const lastSeen = status?.lastSeen ? new Date(status.lastSeen).toLocaleString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-US') : 'N/A';

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-slate-50 dark:bg-slate-950">
            <Sidebar userRole="Admin" />
            <div className="flex flex-col relative overflow-x-hidden pb-24 md:pb-0">
                <header className="pt-16 md:pt-6 pb-6 px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 sticky top-0 z-30">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dawami</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">Sensor Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="relative group cursor-pointer">
                                    <div className="w-12 h-12 rounded-full ring-4 ring-slate-50 dark:ring-slate-800 overflow-hidden shadow-sm">
                                        <Avatar className="h-full w-full">
                                            <AvatarFallback>A</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild><Link href="/profile">{t('nav.profile')}</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/settings">{t('nav.settings')}</Link></DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { auth?.signOut(); router.push('/login'); }}>
                                    {t('nav.logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 px-6 pt-8 max-w-5xl mx-auto w-full pb-24 md:pb-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold font-display text-navy-deep dark:text-white">{t('nav.sensor')}</h2>
                        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading} className="rounded-full">
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {language === 'ar' ? 'تحديث' : language === 'fr' ? 'Actualiser' : 'Refresh'}
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 rounded-[32px] shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    {language === 'ar' ? 'حالة النظام' : language === 'fr' ? 'État du Système' : 'System Status'}
                                </CardTitle>
                                {isOnline ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-navy-deep dark:text-white flex items-center gap-2">
                                    <Badge variant={isOnline ? "default" : "destructive"} className="px-3 rounded-full uppercase text-[10px] font-bold">
                                        {status?.status || 'Unknown'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                    {status?.message || 'No message from sensor.'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {language === 'ar' ? 'آخر ظهور' : language === 'fr' ? 'Dernière Activité' : 'Last Seen'}
                                </CardTitle>
                                <Clock className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-navy-deep dark:text-white">{lastSeen}</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                                    {language === 'ar' ? 'تحديث تلقائي' : language === 'fr' ? 'Mise à jour auto' : 'Auto-heartbeat active'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {language === 'ar' ? 'الاتصال' : language === 'fr' ? 'Connectivité' : 'Connectivity'}
                                </CardTitle>
                                <Wifi className="h-5 w-5 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-navy-deep dark:text-white">ESP32 + WiFi</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                                    {language === 'ar' ? 'بروتوكول HTTP' : language === 'fr' ? 'Protocole HTTP' : 'REST API Connection'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-12 overflow-hidden border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-[32px] shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Code className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">ESP32 Arduino Code</CardTitle>
                                    <CardDescription className="text-xs">
                                        Deploy this configuration to your hardware
                                    </CardDescription>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={handleCopy} className="rounded-full">
                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {copied ? 'Copied' : 'Copy Code'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative group">
                                <pre className="p-6 text-[10px] font-mono bg-slate-950 text-emerald-400 overflow-x-auto max-h-[400px] no-scrollbar">
                                    {esp32Code}
                                </pre>
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-950/20"></div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <BottomNavBar userRole="Admin" />
            </div>
        </div>
    );
}
