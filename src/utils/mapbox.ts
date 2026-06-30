import Constants from 'expo-constants';

const MAPBOX_STYLE = 'mapbox/streets-v12';
const MAPBOX_STYLE_CACHE_BUST = '2026-05-31';
const MAPBOX_STYLE_PREVIEW = `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}.html`;

export function getMapboxPublicToken() {
    const extra = (Constants.expoConfig?.extra || {}) as { mapbox?: { publicToken?: string; accessToken?: string } };
    return process.env.EXPO_PUBLIC_MAPBOX_TOKEN || extra.mapbox?.publicToken || extra.mapbox?.accessToken || '';
}

export function getMapboxTileUrlTemplate(token = getMapboxPublicToken()) {
    if (!token) return '';
    return `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/512/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(token)}&cache=${MAPBOX_STYLE_CACHE_BUST}`;
}

export function getMapboxTileUrl(z: number, x: number, y: number, token = getMapboxPublicToken()) {
    if (!token) return '';
    return `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/512/${z}/${x}/${y}@2x?access_token=${encodeURIComponent(token)}&cache=${MAPBOX_STYLE_CACHE_BUST}`;
}

export function getMapboxStylePreviewUrl(center: { latitude: number; longitude: number }, zoom = 15, token = getMapboxPublicToken()) {
    if (!token) return '';
    const lat = center.latitude.toFixed(5);
    const lng = center.longitude.toFixed(5);
    return `${MAPBOX_STYLE_PREVIEW}?access_token=${encodeURIComponent(token)}#${zoom}/${lat}/${lng}/0/0`;
}
