import { Coordinate } from '../stores/runStore';

export type SuggestedRouteType = 'loop' | 'out-and-back' | 'city-grid';

const haversineDistanceKm = (a: Coordinate, b: Coordinate): number => {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const pathDistanceKm = (points: Coordinate[]): number => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += haversineDistanceKm(points[i - 1], points[i]);
    }
    return total;
};

const offsetCoordinate = (origin: Coordinate, northMeters: number, eastMeters: number): Coordinate => {
    const dLat = northMeters / 111_320;
    const dLon = eastMeters / (111_320 * Math.cos((origin.latitude * Math.PI) / 180));
    return {
        latitude: origin.latitude + dLat,
        longitude: origin.longitude + dLon,
    };
};

const buildShapeRoute = (
    origin: Coordinate,
    targetKm: number,
    routeType: SuggestedRouteType
): Coordinate[] => {
    const targetMeters = Math.max(1000, targetKm * 1000);

    if (routeType === 'out-and-back') {
        const half = targetMeters / 2;
        const turn = offsetCoordinate(origin, half, 0);
        return [origin, turn, origin];
    }

    if (routeType === 'city-grid') {
        const side = Math.max(180, targetMeters / 4);
        const p1 = offsetCoordinate(origin, side, 0);
        const p2 = offsetCoordinate(p1, 0, side);
        const p3 = offsetCoordinate(origin, 0, side);
        return [origin, p1, p2, p3, origin];
    }

    const radius = Math.max(150, Math.min(1500, targetMeters / (2 * Math.PI)));
    const points = 28;
    return Array.from({ length: points + 1 }, (_, i) => {
        const angle = (i / points) * Math.PI * 2;
        return offsetCoordinate(origin, Math.sin(angle) * radius, Math.cos(angle) * radius);
    });
};

const encodeCoords = (points: Coordinate[]) =>
    points.map((p) => `${p.longitude},${p.latitude}`).join(';');

type OsrmResponse = {
    code: string;
    routes?: Array<{
        distance: number;
        duration: number;
        geometry: {
            type: 'LineString';
            coordinates: [number, number][];
        };
    }>;
};

const toCoordinates = (coords: [number, number][]): Coordinate[] =>
    coords.map(([longitude, latitude]) => ({ latitude, longitude }));

export async function getSuggestedRunRoute(options: {
    origin: Coordinate;
    targetKm: number;
    routeType: SuggestedRouteType;
}): Promise<Coordinate[]> {
    const shaped = buildShapeRoute(options.origin, options.targetKm, options.routeType);

    // Uses public OSRM routing with foot profile.
    // `exclude` asks the backend to avoid highway-like classes when available.
    const url = `https://router.project-osrm.org/route/v1/foot/${encodeCoords(shaped)}?overview=full&geometries=geojson&steps=false&continue_straight=true&exclude=motorway,motorway_link,trunk,trunk_link`;

    try {
        const response = await fetch(url);
        if (!response.ok) return shaped;

        const json = (await response.json()) as OsrmResponse;
        const geometry = json.routes?.[0]?.geometry?.coordinates;
        if (!geometry || geometry.length < 2) return shaped;
        const routed = toCoordinates(geometry);
        const routedKm = pathDistanceKm(routed);
        const targetKm = Math.max(1, options.targetKm);
        const withinReason = routedKm >= targetKm * 0.6 && routedKm <= targetKm * 1.6;

        return withinReason ? routed : shaped;
    } catch {
        return shaped;
    }
}
