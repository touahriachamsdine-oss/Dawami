'use client'

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeviceEditDialog } from "@/components/devices/device-edit-dialog";
import 'leaflet/dist/leaflet.css';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, User as UserIcon, TabletSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import Leaflet components to prevent SSR errors
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);
const Circle = dynamic(
    () => import('react-leaflet').then((mod) => mod.Circle),
    { ssr: false }
);

interface Device {
    id: string;
    deviceId: string;
    name: string;
    status: string;
    lastSeen: string;
    lat: number | null;
    lng: number | null;
    lastUser: string;
    allowedLat: number | null;
    allowedLng: number | null;
    allowedRadius: number;
}

interface UserLocation {
    id: string;
    name: string;
    avatarUrl: string | null;
    lat: number;
    lng: number;
    lastSeen: string;
    status: string;
    riskLevel: string;
}

export default function LiveMapClient() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [users, setUsers] = useState<UserLocation[]>([]);
    const [mounted, setMounted] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState<"all" | "devices" | "users">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
        setMounted(true);
        // Leaflet Icon Fix
        (async () => {
            if (typeof window !== 'undefined') {
                try {
                    const L = (await import('leaflet')).default;
                    // @ts-ignore
                    delete L.Icon.Default.prototype._getIconUrl;
                    L.Icon.Default.mergeOptions({
                        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    });
                } catch (e) {
                    console.error("Leaflet init error", e);
                }
            }
        })();

        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [date]); // Refetch when date changes

    const fetchData = async () => {
        try {
            const dateStr = date ? format(date, "yyyy-MM-dd") : "";

            const p1 = fetch(`/api/map/devices?date=${dateStr}`).then(r => r.json());
            const p2 = fetch(`/api/map/users?date=${dateStr}`).then(r => r.json());

            const [devData, usrData] = await Promise.all([p1, p2]);
            setDevices(Array.isArray(devData) ? devData : []);
            setUsers(Array.isArray(usrData) ? usrData : []);

        } catch (e) {
            console.error(e);
        }
    }

    if (!mounted) return <div className="h-96 w-full bg-muted animate-pulse rounded-xl" />;

    const defaultCenter: [number, number] = [36.75, 3.05];
    // Center map on first available device or user
    const center: [number, number] =
        devices.find(d => d.lat && d.lng) ? [devices.find(d => d.lat && d.lng)!.lat!, devices.find(d => d.lat && d.lng)!.lng!] :
            users.find(u => u.lat && u.lng) ? [users.find(u => u.lat && u.lng)!.lat, users.find(u => u.lat && u.lng)!.lng] :
                defaultCenter;

    const showDevices = filterType === "all" || filterType === "devices";
    const showUsers = filterType === "all" || filterType === "users";

    const filteredDevices = devices.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.deviceId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
            <Card className="col-span-1 lg:col-span-3 h-full overflow-hidden border-0 shadow-none ring-1 ring-border relative">
                <div className="absolute top-4 left-14 z-[400] flex gap-2 bg-white/80 dark:bg-black/50 p-2 rounded-lg backdrop-blur-sm shadow-sm scale-90 lg:scale-100 origin-top-left transition-all">
                    <div className="flex items-center gap-1 bg-white/80 dark:bg-black/50 p-1 rounded-lg backdrop-blur-sm">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    size="sm"
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal border-0 bg-transparent h-8",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>All Time</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {date && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-slate-200"
                                onClick={() => setDate(undefined)}
                            >
                                <span className="text-xs">✕</span>
                            </Button>
                        )}
                    </div>

                    <div className="flex bg-muted rounded-md p-1 items-center h-10">
                        <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                            <TabsList className="h-8">
                                <TabsTrigger value="all" className="h-7 text-xs">All</TabsTrigger>
                                <TabsTrigger value="devices" className="h-7 text-xs">Devices</TabsTrigger>
                                <TabsTrigger value="users" className="h-7 text-xs">Users</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <div className="h-full w-full rounded-xl overflow-hidden relative z-0">
                    <MapContainer center={center} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Devices Layer */}
                        {showDevices && filteredDevices.map(d => d.lat && d.lng && (
                            <div key={`d-${d.id}`}>
                                <Marker position={[d.lat, d.lng]} eventHandlers={{
                                    click: () => { console.log('Device clicked', d.name) }
                                }}>
                                    <Popup>
                                        <div className="p-2 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TabletSmartphone className="w-4 h-4 text-blue-500" />
                                                <h3 className="font-bold text-lg">{d.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={d.status === 'Online' ? 'default' : 'secondary'}>{d.status}</Badge>
                                                <span className="text-xs text-muted-foreground">{new Date(d.lastSeen).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">ID: {d.deviceId}</p>
                                            {d.lastUser !== "None" && (
                                                <div className="mt-2 pt-2 border-t">
                                                    <p className="text-sm font-medium">Last User: {d.lastUser}</p>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                                {d.allowedLat && d.allowedLng && (
                                    <Circle
                                        center={[d.allowedLat, d.allowedLng]}
                                        radius={d.allowedRadius}
                                        pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
                                    />
                                )}
                            </div>
                        ))}

                        {/* Users Layer */}
                        {showUsers && filteredUsers.map(u => (
                            <Marker key={`u-${u.id}`} position={[u.lat, u.lng]} opacity={0.9}
                            // Use a different icon for users if possible, or color. Default blue is fine for now but users should be distinctive.
                            // Ideally we use a custom divIcon here, but keeping it simple for stability.
                            >
                                <Popup>
                                    <div className="p-2 min-w-[150px]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <UserIcon className="w-4 h-4 text-amber-500" />
                                            <h3 className="font-bold">{u.name}</h3>
                                        </div>
                                        <Badge variant={u.status === 'ACCEPTED' ? 'outline' : 'destructive'} className="mr-2">{u.status}</Badge>
                                        {u.riskLevel === 'HIGH' && <Badge variant="destructive">High Risk</Badge>}
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {new Date(u.lastSeen).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </Card>

            <Card className="col-span-1 h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Stats & Items</CardTitle>
                    <Input
                        placeholder="Search devices or users..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="mt-2"
                    />
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto flex-1 p-2">

                    {showDevices && filteredDevices.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-2 px-2">Devices ({filteredDevices.length})</p>
                            {filteredDevices.map(d => (
                                <div key={d.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer mb-2 flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold truncate w-24 text-sm" title={d.name}>{d.name}</h4>
                                        <div className="flex gap-2 items-center">
                                            <Badge className="text-[10px] h-5" variant={d.status === 'Online' ? 'default' : 'secondary'}>{d.status}</Badge>
                                            <DeviceEditDialog device={d} onUpdate={fetchData} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>ID: {d.deviceId}</span>
                                        <span>{d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showUsers && filteredUsers.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-2 px-2">Users ({filteredUsers.length})</p>
                            {filteredUsers.map(u => (
                                <div key={u.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer mb-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-semibold text-sm truncate">{u.name}</h4>
                                        <span className="text-xs text-muted-foreground">{new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Badge className="text-[10px] h-5" variant={u.status === 'ACCEPTED' ? 'outline' : 'destructive'}>{u.status}</Badge>
                                        {u.riskLevel === 'HIGH' && <Badge className="text-[10px] h-5" variant="destructive">High Risk</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {((showDevices && filteredDevices.length === 0) && (showUsers && filteredUsers.length === 0)) && (
                        <p className="text-center text-muted-foreground py-10 text-sm">No items found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
