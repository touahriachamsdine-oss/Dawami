'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDevice } from "@/app/actions/device-actions";

export function DeviceEditDialog({ device, onUpdate }: { device: any, onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(device.name);
    const [lat, setLat] = useState(device.allowedLat || "");
    const [lng, setLng] = useState(device.allowedLng || "");
    const [radius, setRadius] = useState(device.allowedRadius || 100);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.stopPropagation();
        setIsSaving(true);
        await updateDevice(device.id, {
            name,
            allowedLat: lat ? parseFloat(lat) : null,
            allowedLng: lng ? parseFloat(lng) : null,
            allowedRadius: parseInt(radius)
        });
        setIsSaving(false);
        setOpen(false);
        onUpdate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={(e) => e.stopPropagation()}>Edit</Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Edit Device: {device.deviceId}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Friendly Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Entrance" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Allowed Latitude</Label>
                            <Input type="number" step="0.000001" value={lat} onChange={e => setLat(e.target.value)} placeholder="36.7..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Allowed Longitude</Label>
                            <Input type="number" step="0.000001" value={lng} onChange={e => setLng(e.target.value)} placeholder="3.0..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Geofence Radius (meters)</Label>
                        <Input type="number" value={radius} onChange={e => setRadius(e.target.value)} />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
