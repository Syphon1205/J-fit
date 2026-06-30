import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { Activity, CalendarCheck, CheckCircle2, Clock3, Droplets, Dumbbell, Flame, Footprints, Gauge, HeartPulse, Moon, Play, Plus, Route, Salad, Scale, TrendingUp, UserRound, Watch, type LucideIcon } from 'lucide-react';
import WeatherCard, { WeatherCardHour, WeatherCardWeather, WeatherCardWindow } from '../components/WeatherCard';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useHealthStore } from '../stores/healthStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useThemeStore } from '../stores/themeStore';

type WeatherCode =
    | 0 | 1 | 2 | 3 | 45 | 48 | 51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67
    | 71 | 73 | 75 | 77 | 80 | 81 | 82 | 85 | 86 | 95 | 96 | 99;

type OpenMeteoResponse = {
    current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        dew_point_2m: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        weather_code: WeatherCode;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        weather_code: WeatherCode[];
        wind_speed_10m: number[];
    };
};

type LocationTarget = {
    latitude: number;
    longitude: number;
    city: string;
    timezone: string;
    source: 'device' | 'browser' | 'fallback';
};

type ReverseGeocodeResponse = {
    results?: Array<{ name?: string; admin1?: string; country_code?: string; timezone?: string }>;
};

const fallbackWeather: WeatherCardWeather = {
    city: 'Finding location',
    observedAt: 'Waiting for GPS',
    condition: 'Loading local weather',
    temperature: 0,
    feelsLike: 0,
    humidity: 0,
    dewpoint: 0,
    wind: '-- mph',
};

const fallbackHours: WeatherCardHour[] = [
    { time: '2 PM', temp: 78, precipitation: 6, windMph: 12 },
    { time: '3 PM', temp: 79, precipitation: 8, windMph: 13 },
    { time: '4 PM', temp: 76, precipitation: 12, windMph: 10 },
    { time: '5 PM', temp: 72, precipitation: 18, windMph: 8 },
    { time: '6 PM', temp: 69, precipitation: 10, windMph: 6 },
    { time: '7 PM', temp: 68, precipitation: 5, windMph: 5 },
];

const fallbackLocation: LocationTarget = {
    latitude: 35.4676,
    longitude: -97.5164,
    city: 'Current Location',
    timezone: 'auto',
    source: 'fallback',
};

const filters = ['Today', 'Agenda', 'Fitness', 'Sleep', 'Nutrition'] as const;
type DashboardFilter = (typeof filters)[number];

type AgendaItem = {
    id: string;
    time: string;
    title: string;
    source: 'user' | 'trainer';
    done: boolean;
};

const agendaStorageKey = 'cf-dashboard-agenda';

const defaultAgendaItems: AgendaItem[] = [
    { id: 'morning-walk', time: '9:00 AM', title: '10 min walk or mobility reset', source: 'trainer', done: false },
    { id: 'water-check', time: '1:00 PM', title: 'Hydration and protein check-in', source: 'user', done: false },
    { id: 'wind-down', time: '9:30 PM', title: 'Sleep wind-down routine', source: 'trainer', done: false },
];

function weatherDescription(code: WeatherCode) {
    if (code === 0) return 'Clear';
    if ([1, 2].includes(code)) return 'Mostly clear';
    if (code === 3) return 'Cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain nearby';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
    if ([95, 96, 99].includes(code)) return 'Storm risk';
    return 'Outdoor conditions';
}

function windDirectionLabel(degrees: number) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
}

function formatHourLabel(value: string) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric' }).format(new Date(value));
}

function formatObserved(value: string) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));
}

function formatCityName(target: LocationTarget) {
    if (target.city && target.city !== 'Current Location') return target.city;
    return target.source === 'fallback' ? fallbackLocation.city : 'Current location';
}

function browserLocation(): Promise<LocationTarget> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            reject(new Error('browser geolocation unavailable'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city: 'Current Location',
                timezone: 'auto',
                source: 'browser',
            }),
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 },
        );
    });
}

async function reverseGeocode(target: LocationTarget): Promise<LocationTarget> {
    try {
        const params = new URLSearchParams({
            latitude: String(target.latitude),
            longitude: String(target.longitude),
            count: '1',
            language: 'en',
            format: 'json',
        });
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?${params.toString()}`);
        if (!response.ok) throw new Error('reverse geocode failed');
        const data = (await response.json()) as ReverseGeocodeResponse;
        const place = data.results?.[0];
        if (!place?.name) return target;
        return {
            ...target,
            city: [place.name, place.admin1 || place.country_code].filter(Boolean).join(', '),
            timezone: place.timezone || target.timezone,
        };
    } catch {
        return target;
    }
}

async function getDeviceLocation(): Promise<LocationTarget> {
    try {
        const permission = await Geolocation.requestPermissions();
        if (permission.location === 'granted') {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5 * 60 * 1000,
            });
            return reverseGeocode({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city: 'Current Location',
                timezone: 'auto',
                source: 'device',
            });
        }
    } catch {
        // Browser geolocation below covers web previews and permission edge cases.
    }

    try {
        return reverseGeocode(await browserLocation());
    } catch {
        return fallbackLocation;
    }
}

function scoreTrainingHour(hour: WeatherCardHour) {
    const tempScore = Math.max(0, 100 - Math.abs(hour.temp - 66) * 5);
    const windScore = Math.max(0, 100 - hour.windMph * 4);
    const rainScore = Math.max(0, 100 - hour.precipitation * 2.2);
    return Math.round(tempScore * 0.46 + windScore * 0.28 + rainScore * 0.26);
}

function buildTrainingWindow(hours: WeatherCardHour[]): WeatherCardWindow {
    const ranked = hours.map((hour) => ({ ...hour, score: scoreTrainingHour(hour) }));
    const best = ranked.reduce((winner, hour) => (hour.score > winner.score ? hour : winner), ranked[0] ?? fallbackHours[0]);
    const calmWind = Math.max(1, best.windMph);
    return {
        title: `Optimal Run Window: ${best.time}`,
        summary: `Comfortable training conditions near ${best.temp}° with wind around ${calmWind} mph.`,
    };
}

function ProgressRing({ value }: { value: number }) {
    const size = 148;
    const stroke = 16;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(1, value)));

    return (
        <div style={styles.ringShell}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--app-border)" strokeWidth={stroke} fill="none" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--app-accent)"
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <div style={styles.ringCenter}>
                <strong>{Math.round(value * 100)}%</strong>
                <span>Weekly cardio</span>
            </div>
        </div>
    );
}

export function Dashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { weeklySteps, weeklyWorkoutMinutes, weightHistory } = useProgressStore();
    const { workoutLogs } = useWorkoutStore();
    const latestSnapshot = useHealthStore((state) => state.latestSnapshot);
    const syncHealthSnapshot = useHealthStore((state) => state.syncHealthSnapshot);
    const { weeklyPlan, dailyGoals, waterIntake, addWater, logMealItem, resetDailyIfNeeded } = useNutritionStore();
    const liveWeatherEnabled = useThemeStore((state) => state.liveWeatherEnabled);
    const units = useThemeStore((state) => state.units);
    const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>('Today');
    const [metricsOpen, setMetricsOpen] = useState(false);
    const [weather, setWeather] = useState<WeatherCardWeather>(fallbackWeather);
    const [hours, setHours] = useState<WeatherCardHour[]>(fallbackHours);
    const [weatherStatus, setWeatherStatus] = useState('Getting device location');
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(defaultAgendaItems);
    const [agendaDraft, setAgendaDraft] = useState('');
    const [foodDraft, setFoodDraft] = useState('');
    const [calorieDraft, setCalorieDraft] = useState('');
    const [proteinDraft, setProteinDraft] = useState('');

    const trainingWindow = useMemo(() => buildTrainingWindow(hours), [hours]);
    const weeklyMinutes = weeklyWorkoutMinutes.reduce((sum, value) => sum + value, 0);
    const cardioProgress = Math.min(1, weeklyMinutes / 150);
    const stepsToday = latestSnapshot?.stepsToday ?? weeklySteps[weeklySteps.length - 1] ?? 0;
    const todayCalories = workoutLogs.slice(0, 3).reduce((sum, log) => sum + log.caloriesBurned, 0);
    const strengthSessions = workoutLogs.filter((log) => {
        const logged = new Date(log.date).getTime();
        return Number.isFinite(logged) && Date.now() - logged < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const readiness = Math.round(((cardioProgress + Math.min(1, stepsToday / 9000) + Math.min(1, strengthSessions / 3)) / 3) * 100);
    const activeCalories = latestSnapshot?.activeCaloriesToday;
    const distanceKm = latestSnapshot?.distanceKmToday;
    const displayDistance = units === 'imperial'
        ? (distanceKm ? `${(distanceKm * 0.621371).toFixed(2)} mi` : 'Pending')
        : (distanceKm ? `${distanceKm.toFixed(2)} km` : 'Pending');
    const latestWeightKg = latestSnapshot?.bodyWeightKg ?? weightHistory.at(-1)?.value ?? user?.weight ?? 76;
    const displayWeight = units === 'imperial'
        ? `${Math.round(latestWeightKg * 2.20462)} lb`
        : `${Math.round(latestWeightKg)} kg`;
    const heartRate = latestSnapshot?.heartRateBpm ?? latestSnapshot?.restingHeartRateBpm;
    const zoneBase = heartRate ?? 70;
    const zone2Low = Math.round(zoneBase + 38);
    const zone2High = Math.round(zoneBase + 58);
    const zone3High = Math.round(zone2High + 18);
    const cardioMinutesLeft = Math.max(0, 150 - weeklyMinutes);
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todayNutrition = weeklyPlan[todayIndex] ?? weeklyPlan[0];
    const caloriesRemaining = Math.max(0, dailyGoals.calories - (todayNutrition?.totalCalories ?? 0));
    const proteinRemaining = Math.max(0, dailyGoals.protein - (todayNutrition?.totalProtein ?? 0));
    const waterProgress = Math.min(1, waterIntake / Math.max(1, dailyGoals.water));

    useEffect(() => {
        void syncHealthSnapshot().catch(() => undefined);
    }, [syncHealthSnapshot]);

    useEffect(() => {
        resetDailyIfNeeded();
    }, [resetDailyIfNeeded]);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(agendaStorageKey);
            if (!stored) return;
            const parsed = JSON.parse(stored) as AgendaItem[];
            if (Array.isArray(parsed) && parsed.length > 0) setAgendaItems(parsed);
        } catch {
            // Keep the default agenda if local storage is unavailable or malformed.
        }
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(agendaStorageKey, JSON.stringify(agendaItems));
        } catch {
            // Agenda still works for this session if storage is unavailable.
        }
    }, [agendaItems]);

    useEffect(() => {
        if (!liveWeatherEnabled) {
            setWeatherStatus('Live weather disabled');
            return;
        }
        let cancelled = false;

        async function loadWeather() {
            try {
                setWeatherStatus('Getting device location');
                const target = await getDeviceLocation();
                if (cancelled) return;
                setWeatherStatus(target.source === 'fallback' ? 'Location permission needed' : 'Live local weather');

                const params = new URLSearchParams({
                    latitude: String(target.latitude),
                    longitude: String(target.longitude),
                    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,weather_code,wind_speed_10m,wind_direction_10m',
                    hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
                    temperature_unit: 'fahrenheit',
                    wind_speed_unit: 'mph',
                    precipitation_unit: 'inch',
                    timezone: target.timezone || 'auto',
                    forecast_days: '2',
                });
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
                if (!response.ok) throw new Error('weather request failed');
                const data = (await response.json()) as OpenMeteoResponse;
                if (cancelled) return;

                const now = Date.now();
                const nextHours = data.hourly.time
                    .map((time, index) => ({ time, index }))
                    .filter(({ time }) => new Date(time).getTime() >= now - 60 * 60 * 1000)
                    .slice(0, 8)
                    .map(({ time, index }) => ({
                        time: formatHourLabel(time),
                        temp: Math.round(data.hourly.temperature_2m[index]),
                        precipitation: Math.round(data.hourly.precipitation_probability[index] ?? 0),
                        windMph: Math.round(data.hourly.wind_speed_10m[index]),
                    }));

                setWeather({
                    city: formatCityName(target),
                    observedAt: formatObserved(data.current.time),
                    condition: weatherDescription(data.current.weather_code),
                    temperature: Math.round(data.current.temperature_2m),
                    feelsLike: Math.round(data.current.apparent_temperature),
                    humidity: Math.round(data.current.relative_humidity_2m),
                    dewpoint: Math.round(data.current.dew_point_2m),
                    wind: `${windDirectionLabel(data.current.wind_direction_10m)} ${Math.round(data.current.wind_speed_10m)} mph`,
                });
                if (nextHours.length > 0) setHours(nextHours);
            } catch {
                if (!cancelled) setWeatherStatus('Weather fallback');
            }
        }

        loadWeather();
        const interval = window.setInterval(loadWeather, 10 * 60 * 1000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [liveWeatherEnabled]);

    const go = (route: string) => router.push(route as never);
    const firstName = user?.name?.split(' ')[0] || 'there';
    const avatar = user?.avatar;
    const quickActions: Array<[string, LucideIcon, string, string]> = [
        ['Train now', Dumbbell, '/workouts', 'var(--app-accent)'],
        ['Run tracker', Route, '/run', 'var(--app-secondary)'],
        ['Readiness', HeartPulse, '/readiness', 'var(--app-accent)'],
        ['Food log', Salad, '/nutrition/log-meal', 'var(--app-secondary)'],
    ];
    const addAgendaItem = () => {
        const title = agendaDraft.trim();
        if (!title) return;
        const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date());
        setAgendaItems((items) => [
            { id: `agenda-${Date.now()}`, time, title, source: 'user', done: false },
            ...items,
        ]);
        setAgendaDraft('');
    };
    const toggleAgendaItem = (id: string) => {
        setAgendaItems((items) => items.map((item) => item.id === id ? { ...item, done: !item.done } : item));
    };
    const addFoodLog = () => {
        const name = foodDraft.trim();
        const calories = Number(calorieDraft);
        const protein = Number(proteinDraft);
        if (!name || !Number.isFinite(calories) || calories <= 0) return;
        logMealItem({
            name,
            mealType: 'Meal',
            calories: Math.round(calories),
            protein: Number.isFinite(protein) ? Math.max(0, Math.round(protein)) : 0,
            carbs: 0,
            fat: 0,
        });
        setFoodDraft('');
        setCalorieDraft('');
        setProteinDraft('');
    };
    const sleepHours = latestSnapshot?.sleepHours;
    const sleepScore = sleepHours ? Math.max(42, Math.min(98, Math.round((sleepHours / 8) * 86 + (latestSnapshot?.hrvMs ? 8 : 0)))) : null;
    const sleepDebt = sleepHours ? Math.max(0, 7.5 - sleepHours) : null;
    const connectedSource = useHealthStore.getState().sources.find((source) => source.connected);
    const sleepStageRows = [
        ['Deep', sleepHours ? `${Math.max(0.7, sleepHours * 0.18).toFixed(1)} hr` : 'Pending', 'Muscle repair and growth hormone window'],
        ['REM', sleepHours ? `${Math.max(0.8, sleepHours * 0.23).toFixed(1)} hr` : 'Pending', 'Learning, mood, and nervous system reset'],
        ['Core', sleepHours ? `${Math.max(2.8, sleepHours * 0.52).toFixed(1)} hr` : 'Pending', 'The bulk of your nightly sleep volume'],
        ['Awake', sleepHours ? `${Math.max(0.1, 8.4 - sleepHours).toFixed(1)} hr` : 'Pending', 'Fragmentation watch trend'],
    ] as const;

    return (
        <div style={styles.screen}>
            <main style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <p style={styles.kicker}>Good morning, {firstName}</p>
                        <h1 style={styles.title}>Today</h1>
                        <p style={styles.subtle}>{latestSnapshot ? `Wearable data imported from ${latestSnapshot.sourceLabel}` : 'Wearable metrics import from Apple Health or Health Connect when available.'}</p>
                    </div>
                    <button type="button" style={styles.avatarButton} onClick={() => go('/profile')}>
                        {avatar ? <img src={avatar} alt={firstName} style={styles.avatarImage} /> : <span>{firstName.charAt(0).toUpperCase()}</span>}
                    </button>
                </header>

                <div style={styles.segmented}>
                    {filters.map((filter) => (
                        <motion.button
                            key={filter}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                            onClick={() => setSelectedFilter(filter)}
                            style={selectedFilter === filter ? styles.segmentActive : styles.segment}
                        >
                            {filter}
                        </motion.button>
                    ))}
                </div>

                {selectedFilter === 'Today' || selectedFilter === 'Fitness' ? (
                    <section style={styles.primaryCard}>
                        <div style={styles.heroGlow} />
                        <ProgressRing value={cardioProgress} />
                        <div style={styles.primaryStats}>
                            <button type="button" style={styles.statPill} onClick={() => go('/progress')}>
                                <Footprints size={18} color="var(--app-secondary)" />
                                <span>Steps</span>
                                <strong>{stepsToday.toLocaleString()}</strong>
                            </button>
                            <button type="button" style={styles.statPill} onClick={() => go('/readiness')}>
                                <HeartPulse size={18} color="var(--app-accent)" />
                                <span>Readiness</span>
                                <strong>{readiness}</strong>
                            </button>
                        </div>
                    </section>
                ) : null}

                {selectedFilter === 'Today' || selectedFilter === 'Nutrition' ? (
                    <section style={styles.keyMetrics}>
                        <div style={styles.rowBetween}>
                            <div>
                                <p style={styles.kicker}>Nutrition</p>
                                <h2 style={styles.sectionTitle}>Food and water</h2>
                            </div>
                            <button type="button" style={styles.viewAll} onClick={() => go('/nutrition/log-meal')}>Log meal</button>
                        </div>
                        <div style={styles.keyMetricGrid}>
                            {([
                                ['Calories left', `${caloriesRemaining}`, Flame, '#f97316'],
                                ['Protein left', `${proteinRemaining}g`, Salad, 'var(--app-accent)'],
                                ['Water', `${waterIntake}/${dailyGoals.water}`, Droplets, 'var(--app-secondary)'],
                                ['Active burn', activeCalories ? `${Math.round(activeCalories)} kcal` : 'Pending', Activity, '#8b5cf6'],
                            ] as const).map(([label, value, Icon, color]) => (
                                <button key={label} type="button" style={styles.keyMetric} onClick={label === 'Water' ? addWater : () => go('/nutrition/log-meal')}>
                                    <span style={{ ...styles.keyIcon, color: String(color), background: `${String(color)}18` }}>
                                        <Icon size={17} />
                                    </span>
                                    <span style={styles.keyLabel}>{label}</span>
                                    <strong style={styles.keyValue}>{value}</strong>
                                </button>
                            ))}
                        </div>
                        <div style={styles.nutritionLogger}>
                            <div style={styles.waterTrack}>
                                <span style={{ ...styles.waterFill, width: `${waterProgress * 100}%` }} />
                            </div>
                            <div style={styles.foodComposer}>
                                <input style={styles.foodInput} value={foodDraft} placeholder="Food" onChange={(event) => setFoodDraft(event.currentTarget.value)} />
                                <input style={styles.foodNumber} value={calorieDraft} placeholder="kcal" inputMode="numeric" onChange={(event) => setCalorieDraft(event.currentTarget.value.replace(/[^\d.]/g, ''))} />
                                <input style={styles.foodNumber} value={proteinDraft} placeholder="protein" inputMode="numeric" onChange={(event) => setProteinDraft(event.currentTarget.value.replace(/[^\d.]/g, ''))} />
                                <button type="button" style={styles.agendaAddButton} onClick={addFoodLog}><Plus size={17} /> Add</button>
                            </div>
                        </div>
                    </section>
                ) : null}

                {metricsOpen ? (
                    <div style={styles.metricSheetBackdrop} onClick={() => setMetricsOpen(false)}>
                        <motion.section
                            initial={{ opacity: 0, y: 180, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 180, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            style={styles.metricSheet}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div style={styles.sheetGrabber} />
                            <div style={styles.metricSheetHeader}>
                                <div>
                                    <p style={styles.kicker}>Full metrics</p>
                                    <h2 style={styles.sectionTitle}>Health dashboard</h2>
                                    <p style={styles.sheetSubtitle}>{connectedSource ? `Synced from ${connectedSource.name}` : 'Connect health sync to unlock watch detail.'}</p>
                                </div>
                                <button type="button" style={styles.closeSheet} onClick={() => setMetricsOpen(false)}>Close</button>
                            </div>
                            <div style={styles.sheetSummaryGrid}>
                                <span style={styles.sheetSummary}><strong>{stepsToday.toLocaleString()}</strong><small>Steps today</small></span>
                                <span style={styles.sheetSummary}><strong>{displayDistance}</strong><small>Distance</small></span>
                                <span style={styles.sheetSummary}><strong>{readiness}</strong><small>Readiness</small></span>
                            </div>
                            <div style={styles.fullMetricGrid}>
                                {([
                                    ['Heart rate', heartRate ? `${heartRate} bpm` : 'Pending', 'Current device snapshot', HeartPulse, 'var(--app-secondary)'],
                                    ['Resting HR', latestSnapshot?.restingHeartRateBpm ? `${latestSnapshot.restingHeartRateBpm} bpm` : 'Pending', 'Recovery baseline', HeartPulse, 'var(--app-accent)'],
                                    ['Weight', displayWeight, 'Latest profile or Health entry', Scale, '#8b5cf6'],
                                    ['HRV', latestSnapshot?.hrvMs ? `${latestSnapshot.hrvMs} ms` : 'Pending', 'Readiness signal', Activity, 'var(--app-secondary)'],
                                    ['Sleep', latestSnapshot?.sleepHours ? `${latestSnapshot.sleepHours} hr` : 'Pending', 'Last sleep estimate', Moon, '#7c3aed'],
                                    ['Steps', stepsToday.toLocaleString(), 'Today from device health', Footprints, 'var(--app-secondary)'],
                                    ['Distance', displayDistance, 'Workout distance from Health when available', Route, 'var(--app-accent)'],
                                    ['Training zones', `Z2 ${zone2Low}-${zone2High}`, `Tempo up to ${zone3High} bpm`, Gauge, '#f97316'],
                                ] as const).map(([label, value, detail, Icon, color]) => (
                                    <button key={label} type="button" style={styles.fullMetric} onClick={() => go(label === 'Training zones' ? '/run' : '/progress')}>
                                        <span style={{ ...styles.keyIcon, color: String(color), background: `${String(color)}18` }}>
                                            <Icon size={18} />
                                        </span>
                                        <span style={styles.metricTextStack}>
                                            <strong style={styles.fullMetricValue}>{value}</strong>
                                            <span style={styles.fullMetricLabel}>{label}</span>
                                            <small style={styles.metricDetail}>{detail}</small>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.section>
                    </div>
                ) : null}

                {selectedFilter === 'Today' ? (
                    <section style={styles.quickGrid}>
                        {quickActions.map(([label, Icon, route, color]) => (
                            <motion.button
                                key={String(label)}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                style={styles.quickButton}
                                onClick={() => go(String(route))}
                            >
                                <span style={{ ...styles.quickIcon, background: `${color}14`, color: String(color) }}>
                                    <Icon size={19} />
                                </span>
                                <span>{label}</span>
                            </motion.button>
                        ))}
                    </section>
                ) : null}

                {selectedFilter === 'Today' || selectedFilter === 'Agenda' ? (
                    <section style={styles.agendaCard}>
                        <div style={styles.rowBetween}>
                            <div>
                                <p style={styles.kicker}>Calendar</p>
                                <h2 style={styles.sectionTitle}>Today’s agenda</h2>
                            </div>
                            <span style={styles.agendaDate}>
                                <CalendarCheck size={15} /> {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date())}
                            </span>
                        </div>
                        <div style={styles.agendaComposer}>
                            <input
                                style={styles.agendaInput}
                                value={agendaDraft}
                                placeholder="Log a workout, meal, note, or reminder"
                                onChange={(event) => setAgendaDraft(event.currentTarget.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') addAgendaItem();
                                }}
                            />
                            <button type="button" style={styles.agendaAddButton} onClick={addAgendaItem}>
                                <Plus size={18} /> Add
                            </button>
                        </div>
                        <div style={styles.agendaList}>
                            {agendaItems.map((item) => (
                                <button key={item.id} type="button" style={item.done ? styles.agendaItemDone : styles.agendaItem} onClick={() => toggleAgendaItem(item.id)}>
                                    <span style={item.done ? styles.agendaCheckDone : styles.agendaCheck}>
                                        {item.done ? <CheckCircle2 size={19} /> : <Clock3 size={17} />}
                                    </span>
                                    <span style={styles.agendaBody}>
                                        <strong style={styles.agendaTitle}>{item.title}</strong>
                                        <span style={styles.agendaMeta}>
                                            {item.time} · {item.source === 'trainer' ? 'Trainer planned' : 'Logged by you'}
                                        </span>
                                    </span>
                                    <span style={item.source === 'trainer' ? styles.trainerBadge : styles.userBadge}>
                                        {item.source === 'trainer' ? <UserRound size={13} /> : <Plus size={13} />}
                                        {item.source}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                ) : null}

                {selectedFilter === 'Today' || selectedFilter === 'Fitness' ? (
                    <section style={styles.trainingCard}>
                        <div style={styles.rowBetween}>
                            <div>
                                <p style={styles.kicker}>Fitness focus</p>
                                <h2 style={styles.sectionTitle}>Today’s training plan</h2>
                            </div>
                            <CalendarCheck color="var(--app-accent)" />
                        </div>
                        <div style={styles.planGrid}>
                            <button type="button" style={styles.planItem} onClick={() => go('/workouts')}>
                                <Dumbbell size={18} color="var(--app-accent)" />
                                <strong>{strengthSessions >= 2 ? 'Strength covered' : 'Lift priority'}</strong>
                                <span>{Math.max(0, 2 - strengthSessions)} strength sessions left for the weekly baseline.</span>
                            </button>
                            <button type="button" style={styles.planItem} onClick={() => go('/run')}>
                                <Route size={18} color="var(--app-secondary)" />
                                <strong>{cardioMinutesLeft === 0 ? 'Cardio on pace' : `${cardioMinutesLeft} min cardio left`}</strong>
                                <span>Stack easy Zone 2, intervals, or a brisk walk toward the weekly target.</span>
                            </button>
                            <button type="button" style={styles.planItem} onClick={() => go('/settings/privacy')}>
                                <Watch size={18} color="#f97316" />
                                <strong>{latestSnapshot ? 'Wearable data imported' : 'Wearable data pending'}</strong>
                                <span>Calories, steps, sleep, runs, and vitals are pulled as one health snapshot when available.</span>
                            </button>
                        </div>
                    </section>
                ) : null}

                {selectedFilter === 'Fitness' ? (
                    <section style={styles.keyMetrics}>
                        <div style={styles.rowBetween}>
                            <div>
                                <p style={styles.kicker}>Workout load</p>
                                <h2 style={styles.sectionTitle}>Fitness dashboard</h2>
                            </div>
                            <button type="button" style={styles.viewAll} onClick={() => go('/workouts')}>Open workouts</button>
                        </div>
                        <div style={styles.keyMetricGrid}>
                            {([
                                ['Sessions', `${strengthSessions}/2`, Dumbbell, 'var(--app-accent)'],
                                ['Cardio mins', `${weeklyMinutes}/150`, Activity, 'var(--app-secondary)'],
                                ['Distance', displayDistance, Route, '#8b5cf6'],
                                ['Readiness', `${readiness}`, HeartPulse, '#f97316'],
                            ] as const).map(([label, value, Icon, color]) => (
                                <button key={label} type="button" style={styles.keyMetric} onClick={() => go(label === 'Distance' ? '/run' : '/progress')}>
                                    <span style={{ ...styles.keyIcon, color: String(color), background: `${String(color)}18` }}>
                                        <Icon size={17} />
                                    </span>
                                    <span style={styles.keyLabel}>{label}</span>
                                    <strong style={styles.keyValue}>{value}</strong>
                                </button>
                            ))}
                        </div>
                    </section>
                ) : null}

                {selectedFilter === 'Sleep' ? (
                    <>
                        <section style={styles.sleepHero}>
                            <div>
                                <p style={styles.kicker}>Watch sleep</p>
                                <h2 style={styles.sleepScore}>{sleepScore ? `${sleepScore}` : '--'}</h2>
                                <p style={styles.subtle}>{sleepScore ? 'Sleep readiness score' : 'Awaiting wearable sleep import'}</p>
                            </div>
                            <span style={styles.sleepMoon}><Moon size={30} /></span>
                        </section>

                        <section style={styles.keyMetrics}>
                            <div style={styles.rowBetween}>
                                <div>
                                    <p style={styles.kicker}>Sleep signals</p>
                                    <h2 style={styles.sectionTitle}>Last night</h2>
                                </div>
                                <button type="button" style={styles.viewAll} onClick={() => void syncHealthSnapshot()}>Refresh</button>
                            </div>
                            <div style={styles.keyMetricGrid}>
                                {([
                                    ['Time asleep', sleepHours ? `${sleepHours.toFixed(1)} hr` : 'Pending', Moon, '#8b5cf6'],
                                    ['Sleep debt', sleepDebt != null ? `${sleepDebt.toFixed(1)} hr` : 'Pending', TrendingUp, '#f97316'],
                                    ['Resting HR', latestSnapshot?.restingHeartRateBpm ? `${latestSnapshot.restingHeartRateBpm} bpm` : 'Pending', HeartPulse, 'var(--app-accent)'],
                                    ['HRV', latestSnapshot?.hrvMs ? `${latestSnapshot.hrvMs} ms` : 'Pending', Activity, 'var(--app-secondary)'],
                                ] as const).map(([label, value, Icon, color]) => (
                                    <article key={label} style={styles.keyMetric}>
                                        <span style={{ ...styles.keyIcon, color: String(color), background: `${String(color)}18` }}>
                                            <Icon size={17} />
                                        </span>
                                        <span style={styles.keyLabel}>{label}</span>
                                        <strong style={styles.keyValue}>{value}</strong>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section style={styles.trainingCard}>
                            <div style={styles.rowBetween}>
                                <div>
                                    <p style={styles.kicker}>Sleep stages</p>
                                    <h2 style={styles.sectionTitle}>Stage breakdown</h2>
                                </div>
                                <Watch color="var(--app-accent)" />
                            </div>
                            <div style={styles.sleepStageList}>
                                {sleepStageRows.map(([stage, value, detail], index) => (
                                    <article key={stage} style={styles.sleepStage}>
                                        <div style={styles.stageBarTrack}>
                                            <span style={{ ...styles.stageBarFill, width: sleepHours ? `${[24, 29, 68, 14][index]}%` : '12%' }} />
                                        </div>
                                        <div style={styles.stageText}>
                                            <strong>{stage}</strong>
                                            <span>{detail}</span>
                                        </div>
                                        <b>{value}</b>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section style={styles.trainingCard}>
                            <div>
                                <p style={styles.kicker}>Recovery guidance</p>
                                <h2 style={styles.sectionTitle}>What to do today</h2>
                            </div>
                            <div style={styles.sleepNotes}>
                                <p>{sleepHours ? (sleepHours < 6.5 ? 'Keep intensity lower today. Bias mobility, Zone 2, and technique work until sleep rebounds.' : 'Sleep volume looks usable. Let HRV and resting heart rate decide how hard you push.') : 'Sleep, HRV, and resting heart rate will populate from the imported wearable snapshot when available.'}</p>
                                <button type="button" style={styles.startButton} onClick={() => go('/settings/privacy')}>
                                    <Watch size={16} /> Manage sync
                                </button>
                            </div>
                        </section>
                    </>
                ) : null}

                {selectedFilter === 'Today' || selectedFilter === 'Fitness' ? (
                    <WeatherCard
                        weather={weather}
                        hours={hours}
                        trainingWindow={trainingWindow}
                        status={weatherStatus}
                        onScheduleRun={() => go('/run')}
                    />
                ) : null}

                {selectedFilter === 'Today' ? (
                    <section style={styles.insightCard}>
                        <div style={styles.insightIcon}><Activity size={20} /></div>
                        <div>
                            <p style={styles.insightTitle}>Daily summary</p>
                            <p style={styles.insightCopy}>
                                {connectedSource
                                    ? `Wearable snapshot imported from ${connectedSource.name}. Calories, steps, sleep, and vitals are available across the app.`
                                    : 'You are trending toward a balanced day. Add food, water, or a short walk to keep the plan current.'}
                            </p>
                        </div>
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                            style={styles.startButton}
                            onClick={() => go('/workouts')}
                        >
                            <Play size={16} /> Start
                        </motion.button>
                    </section>
                ) : null}
            </main>
        </div>
    );
}

const card: CSSProperties = {
    background: 'var(--app-card)',
    border: '1px solid var(--app-border)',
    boxShadow: 'var(--app-shadow)',
};

const buttonReset: CSSProperties = {
    border: 0,
    font: 'inherit',
    WebkitTapHighlightColor: 'transparent',
};

const styles: Record<string, CSSProperties> = {
    screen: {
        minHeight: '100%',
        color: 'var(--app-text)',
        background: 'var(--app-bg)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitFontSmoothing: 'antialiased',
    },
    main: {
        width: '100%',
        maxWidth: 980,
        boxSizing: 'border-box',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '18px 16px 24px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    kicker: {
        margin: 0,
        color: 'var(--app-muted)',
        fontSize: 15,
        lineHeight: 1.35,
        fontWeight: 700,
    },
    title: {
        margin: '4px 0 0',
        color: 'var(--app-heading)',
        fontSize: 32,
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: 0,
    },
    subtle: {
        margin: '6px 0 0',
        color: 'var(--app-muted)',
        fontSize: 14,
        fontWeight: 650,
    },
    avatarButton: {
        ...buttonReset,
        width: 48,
        height: 48,
        borderRadius: 24,
        background: 'var(--app-accent-soft)',
        color: 'var(--app-accent)',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        fontSize: 18,
        fontWeight: 900,
        flexShrink: 0,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    segmented: {
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '2px 0',
    },
    segment: {
        ...buttonReset,
        borderRadius: 999,
        padding: '9px 14px',
        background: 'transparent',
        color: 'var(--app-muted)',
        fontSize: 14,
        fontWeight: 800,
        whiteSpace: 'nowrap',
    },
    segmentActive: {
        ...buttonReset,
        borderRadius: 999,
        padding: '9px 14px',
        background: 'var(--app-text)',
        color: 'var(--app-bg)',
        fontSize: 14,
        fontWeight: 850,
        whiteSpace: 'nowrap',
    },
    primaryCard: {
        ...card,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 32,
        padding: 18,
        display: 'grid',
        gridTemplateColumns: 'minmax(118px, 148px) minmax(0, 1fr)',
        alignItems: 'center',
        gap: 16,
    },
    heroGlow: {
        position: 'absolute',
        inset: '18% -12% -35%',
        background: 'var(--app-hero)',
        filter: 'blur(8px)',
        opacity: 0.9,
        pointerEvents: 'none',
    },
    ringShell: {
        position: 'relative',
        width: 148,
        height: 148,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        zIndex: 1,
    },
    ringCenter: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
    },
    primaryStats: {
        display: 'grid',
        gap: 10,
        minWidth: 0,
        zIndex: 1,
    },
    statPill: {
        ...buttonReset,
        borderRadius: 22,
        background: 'var(--app-bg)',
        padding: 12,
        color: 'var(--app-text)',
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr)',
        columnGap: 8,
        rowGap: 3,
        alignItems: 'center',
        textAlign: 'left',
        minWidth: 0,
        overflow: 'hidden',
    },
    quickGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
    },
    quickButton: {
        ...buttonReset,
        ...card,
        borderRadius: 26,
        padding: 14,
        color: 'var(--app-text)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        fontWeight: 850,
        textAlign: 'left',
    },
    quickIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
    },
    agendaCard: {
        ...card,
        borderRadius: 32,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'linear-gradient(135deg, var(--app-card), color-mix(in srgb, var(--app-accent-soft) 36%, var(--app-card)))',
    },
    agendaDate: {
        borderRadius: 999,
        background: 'var(--app-bg)',
        color: 'var(--app-muted)',
        border: '1px solid var(--app-border)',
        padding: '8px 11px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: 'nowrap',
    },
    agendaComposer: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
    },
    agendaInput: {
        minHeight: 48,
        borderRadius: 999,
        border: '1px solid var(--app-border)',
        background: 'var(--app-bg)',
        color: 'var(--app-heading)',
        outline: 'none',
        padding: '0 16px',
        font: 'inherit',
        fontSize: 14,
        fontWeight: 750,
        minWidth: 0,
        boxSizing: 'border-box',
    },
    agendaAddButton: {
        ...buttonReset,
        minHeight: 48,
        borderRadius: 999,
        background: 'var(--app-gradient-primary)',
        color: '#fff',
        padding: '0 16px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        fontSize: 14,
        fontWeight: 950,
        whiteSpace: 'nowrap',
    },
    agendaList: {
        display: 'grid',
        gap: 9,
    },
    agendaItem: {
        ...buttonReset,
        borderRadius: 24,
        background: 'var(--app-bg)',
        border: '1px solid var(--app-border)',
        color: 'var(--app-text)',
        padding: 12,
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 11,
        textAlign: 'left',
    },
    agendaItemDone: {
        ...buttonReset,
        borderRadius: 24,
        background: 'color-mix(in srgb, var(--app-bg) 72%, var(--app-accent-soft))',
        border: '1px solid var(--app-border)',
        color: 'var(--app-text)',
        padding: 12,
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 11,
        textAlign: 'left',
        opacity: 0.78,
    },
    agendaCheck: {
        width: 38,
        height: 38,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--app-accent)',
        background: 'var(--app-accent-soft)',
        flexShrink: 0,
    },
    agendaCheckDone: {
        width: 38,
        height: 38,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--app-secondary)',
        background: 'color-mix(in srgb, var(--app-secondary) 16%, transparent)',
        flexShrink: 0,
    },
    agendaBody: {
        minWidth: 0,
        display: 'grid',
        gap: 3,
    },
    agendaTitle: {
        color: 'var(--app-heading)',
        fontSize: 14,
        lineHeight: 1.2,
        fontWeight: 900,
        overflowWrap: 'anywhere',
    },
    agendaMeta: {
        color: 'var(--app-muted)',
        fontSize: 12,
        lineHeight: 1.25,
        fontWeight: 750,
        overflowWrap: 'anywhere',
    },
    trainerBadge: {
        borderRadius: 999,
        background: 'var(--app-accent-soft)',
        color: 'var(--app-accent)',
        padding: '7px 9px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 950,
        textTransform: 'capitalize',
    },
    userBadge: {
        borderRadius: 999,
        background: 'var(--app-raised)',
        color: 'var(--app-muted)',
        border: '1px solid var(--app-border)',
        padding: '7px 9px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 950,
        textTransform: 'capitalize',
    },
    trainingCard: {
        ...card,
        borderRadius: 32,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    sleepHero: {
        ...card,
        borderRadius: 32,
        padding: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 18,
        background: 'linear-gradient(135deg, var(--app-card), var(--app-accent-soft))',
    },
    sleepScore: {
        margin: '6px 0 0',
        color: 'var(--app-heading)',
        fontSize: 64,
        lineHeight: 0.95,
        fontWeight: 950,
        letterSpacing: 0,
    },
    sleepMoon: {
        width: 76,
        height: 76,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--app-bg)',
        color: '#8b5cf6',
        flexShrink: 0,
    },
    keyMetrics: {
        ...card,
        borderRadius: 32,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    keyMetricGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))',
        gap: 10,
    },
    keyMetric: {
        ...buttonReset,
        borderRadius: 22,
        background: 'var(--app-bg)',
        color: 'var(--app-text)',
        padding: 12,
        textAlign: 'left',
        display: 'grid',
        gap: 6,
        minWidth: 0,
        minHeight: 122,
        alignContent: 'space-between',
        overflow: 'hidden',
    },
    keyIcon: {
        width: 34,
        height: 34,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
    },
    keyLabel: {
        display: 'block',
        color: 'var(--app-muted)',
        fontSize: 12,
        lineHeight: 1.15,
        fontWeight: 850,
        overflowWrap: 'anywhere',
    },
    keyValue: {
        display: 'block',
        color: 'var(--app-heading)',
        fontSize: 15,
        lineHeight: 1.08,
        fontWeight: 900,
        overflowWrap: 'anywhere',
    },
    nutritionLogger: {
        display: 'grid',
        gap: 12,
        borderRadius: 24,
        background: 'linear-gradient(135deg, var(--app-bg), var(--app-accent-soft))',
        padding: 12,
    },
    waterTrack: {
        height: 10,
        borderRadius: 999,
        background: 'var(--app-border)',
        overflow: 'hidden',
    },
    waterFill: {
        display: 'block',
        height: '100%',
        borderRadius: 999,
        background: 'linear-gradient(90deg, var(--app-secondary), var(--app-accent))',
    },
    foodComposer: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(72px, 92px) minmax(82px, 110px) auto',
        gap: 8,
        alignItems: 'center',
    },
    foodInput: {
        minHeight: 44,
        minWidth: 0,
        borderRadius: 999,
        border: '1px solid var(--app-border)',
        background: 'var(--app-card)',
        color: 'var(--app-heading)',
        outline: 'none',
        padding: '0 14px',
        font: 'inherit',
        fontSize: 13,
        fontWeight: 800,
        boxSizing: 'border-box',
    },
    foodNumber: {
        minHeight: 44,
        minWidth: 0,
        borderRadius: 999,
        border: '1px solid var(--app-border)',
        background: 'var(--app-card)',
        color: 'var(--app-heading)',
        outline: 'none',
        padding: '0 12px',
        font: 'inherit',
        fontSize: 13,
        fontWeight: 800,
        boxSizing: 'border-box',
    },
    viewAll: {
        ...buttonReset,
        borderRadius: 999,
        background: 'var(--app-accent-soft)',
        color: 'var(--app-accent)',
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 900,
    },
    metricSheetBackdrop: {
        position: 'fixed',
        inset: '0 0 calc(env(safe-area-inset-bottom) + 86px) 0',
        zIndex: 10000,
        background: 'linear-gradient(180deg, rgba(15,23,42,0.16), rgba(15,23,42,0.54))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 'calc(env(safe-area-inset-top) + 18px) 12px 0',
        boxSizing: 'border-box',
        touchAction: 'auto',
    },
    metricSheet: {
        ...card,
        width: 'min(980px, 100%)',
        maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 118px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: '34px 34px 0 0',
        padding: '10px 18px 34px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'none',
    },
    sheetGrabber: {
        width: 46,
        height: 5,
        borderRadius: 999,
        background: 'var(--app-border)',
        alignSelf: 'center',
        marginBottom: 2,
    },
    metricSheetHeader: {
        position: 'sticky',
        top: -10,
        zIndex: 2,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '10px 0 8px',
        background: 'linear-gradient(180deg, var(--app-card) 78%, color-mix(in srgb, var(--app-card) 0%, transparent))',
    },
    sheetSubtitle: {
        margin: '5px 0 0',
        color: 'var(--app-muted)',
        fontSize: 12,
        lineHeight: 1.35,
        fontWeight: 750,
    },
    sheetSummaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 10,
    },
    sheetSummary: {
        borderRadius: 22,
        background: 'linear-gradient(135deg, var(--app-bg), var(--app-accent-soft))',
        padding: 12,
        display: 'grid',
        gap: 3,
        minWidth: 0,
    },
    closeSheet: {
        ...buttonReset,
        borderRadius: 999,
        background: 'var(--app-bg)',
        color: 'var(--app-text)',
        padding: '9px 13px',
        fontSize: 12,
        fontWeight: 900,
    },
    fullMetricGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 10,
    },
    fullMetric: {
        ...buttonReset,
        borderRadius: 24,
        background: 'var(--app-bg)',
        color: 'var(--app-text)',
        padding: 14,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 12,
        textAlign: 'left',
        alignItems: 'center',
        minWidth: 0,
        overflow: 'hidden',
    },
    metricTextStack: {
        minWidth: 0,
        display: 'grid',
        gap: 4,
    },
    fullMetricValue: {
        display: 'block',
        color: 'var(--app-heading)',
        fontSize: 18,
        lineHeight: 1.05,
        fontWeight: 950,
        overflowWrap: 'anywhere',
    },
    fullMetricLabel: {
        display: 'block',
        color: 'var(--app-muted)',
        fontSize: 12,
        lineHeight: 1.15,
        fontWeight: 900,
        overflowWrap: 'anywhere',
    },
    metricDetail: {
        display: 'block',
        color: 'var(--app-muted)',
        fontSize: 11,
        lineHeight: 1.25,
        fontWeight: 700,
        overflowWrap: 'anywhere',
    },
    rowBetween: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    sectionTitle: {
        margin: '4px 0 0',
        color: 'var(--app-heading)',
        fontSize: 22,
        lineHeight: 1.05,
        fontWeight: 900,
        letterSpacing: -0.5,
    },
    planGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
        gap: 10,
    },
    planItem: {
        ...buttonReset,
        borderRadius: 24,
        background: 'var(--app-bg)',
        color: 'var(--app-text)',
        padding: 14,
        textAlign: 'left',
        display: 'grid',
        gap: 7,
    },
    sleepStageList: {
        display: 'grid',
        gap: 10,
    },
    sleepStage: {
        borderRadius: 24,
        background: 'var(--app-bg)',
        padding: 14,
        display: 'grid',
        gridTemplateColumns: '72px minmax(0, 1fr) auto',
        gap: 12,
        alignItems: 'center',
    },
    stageBarTrack: {
        height: 9,
        borderRadius: 999,
        background: 'var(--app-muted-surface)',
        overflow: 'hidden',
    },
    stageBarFill: {
        display: 'block',
        height: '100%',
        borderRadius: 999,
        background: 'linear-gradient(90deg, var(--app-accent), var(--app-secondary))',
    },
    stageText: {
        minWidth: 0,
        display: 'grid',
        gap: 3,
    },
    sleepNotes: {
        borderRadius: 24,
        background: 'var(--app-bg)',
        padding: 14,
        display: 'grid',
        gap: 12,
        color: 'var(--app-muted)',
        fontSize: 14,
        lineHeight: 1.45,
        fontWeight: 650,
    },
    insightCard: {
        ...card,
        borderRadius: 30,
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 12,
        alignItems: 'center',
    },
    insightIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--app-accent-soft)',
        color: 'var(--app-secondary)',
    },
    insightTitle: {
        margin: 0,
        color: 'var(--app-heading)',
        fontSize: 15,
        fontWeight: 900,
    },
    insightCopy: {
        margin: '4px 0 0',
        color: 'var(--app-muted)',
        fontSize: 13,
        lineHeight: 1.35,
        fontWeight: 650,
    },
    startButton: {
        ...buttonReset,
        borderRadius: 999,
        background: 'var(--app-accent)',
        color: '#fff',
        minHeight: 40,
        padding: '0 13px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 850,
    },
};
