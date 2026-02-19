import { Coordinates } from "@/types";

const KAABA = {
    latitude: 21.4225,
    longitude: 39.8262,
} satisfies Coordinates;


export function getQiblaBearing(
    userLat: number,
    userLon: number
): number {
    const kaabaLat = KAABA.latitude * (Math.PI / 180)
    const kaabaLon = KAABA.longitude * (Math.PI / 180)

    const φ1 = userLat * (Math.PI / 180)
    const λ1 = userLon * (Math.PI / 180)

    const Δλ = kaabaLon - λ1

    const x = Math.sin(Δλ)
    const y =
        Math.cos(φ1) * Math.tan(kaabaLat) -
        Math.sin(φ1) * Math.cos(Δλ)

    let bearing = Math.atan2(x, y)
    bearing = (bearing * 180) / Math.PI

    return (bearing + 360) % 360
}
