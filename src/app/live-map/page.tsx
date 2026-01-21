import LiveMapClient from "@/components/live-map-client";

export default function LiveMapPage() {
    return (
        <div className="flex flex-col h-full w-full p-4 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Live Map Dashboard</h1>
            <p className="text-muted-foreground">Real-time tracking of attendance devices and geofence zones.</p>
            <LiveMapClient />
        </div>
    );
}
