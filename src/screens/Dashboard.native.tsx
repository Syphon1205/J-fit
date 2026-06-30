import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useHealthStore } from '../stores/healthStore';

type WeatherSnapshot = {
    place: string;
    temp: number;
    feelsLike: number;
    condition: string;
    humidity: number;
    wind: string;
    window: string;
};

const fallbackWeather: WeatherSnapshot = {
    place: 'Local weather',
    temp: 72,
    feelsLike: 73,
    condition: 'Ready for outdoor training',
    humidity: 48,
    wind: '8 mph',
    window: 'Evening easy run',
};

function weatherText(code: number) {
    if (code === 0) return 'Clear';
    if ([1, 2].includes(code)) return 'Mostly clear';
    if (code === 3) return 'Cloudy';
    if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Rain nearby';
    if ([95, 96, 99].includes(code)) return 'Storm risk';
    return 'Outdoor conditions';
}

export default function Dashboard() {
    const router = useRouter();
    const { colors, gradients, isDark } = useThemeColors();
    const { user } = useAuthStore();
    const { weeklySteps, weeklyWorkoutMinutes } = useProgressStore();
    const { workoutLogs } = useWorkoutStore();
    const { weeklyPlan, dailyGoals, waterIntake, addWater, logMealItem, resetDailyIfNeeded } = useNutritionStore();
    const latestSnapshot = useHealthStore((state) => state.latestSnapshot);
    const syncHealthSnapshot = useHealthStore((state) => state.syncHealthSnapshot);
    const [tab, setTab] = useState<'Today' | 'Fitness' | 'Sleep' | 'Nutrition'>('Today');
    const [weather, setWeather] = useState<WeatherSnapshot>(fallbackWeather);
    const [loadingWeather, setLoadingWeather] = useState(true);
    const [foodDraft, setFoodDraft] = useState('');
    const [calorieDraft, setCalorieDraft] = useState('');
    const [proteinDraft, setProteinDraft] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadWeather() {
            try {
                const permission = await Location.requestForegroundPermissionsAsync();
                const position = permission.status === 'granted'
                    ? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
                    : null;
                const latitude = position?.coords.latitude ?? 35.4676;
                const longitude = position?.coords.longitude ?? -97.5164;
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,wind_speed_10m,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1`,
                );
                const data = await response.json();
                const hourly = data?.hourly;
                const bestIndex = Array.isArray(hourly?.temperature_2m)
                    ? hourly.temperature_2m
                        .map((temp: number, index: number) => ({
                            index,
                            score: Math.abs(temp - 66) + (hourly.wind_speed_10m?.[index] ?? 12) * 0.4 + (hourly.precipitation_probability?.[index] ?? 20) * 0.08,
                        }))
                        .sort((a: { score: number }, b: { score: number }) => a.score - b.score)[0]?.index ?? 18
                    : 18;
                const bestTime = hourly?.time?.[bestIndex]
                    ? new Date(hourly.time[bestIndex]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                    : '6:00 PM';
                const current = data?.current;
                if (!cancelled && current) {
                    setWeather({
                        place: position ? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}` : 'Oklahoma City fallback',
                        temp: Math.round(current.temperature_2m),
                        feelsLike: Math.round(current.apparent_temperature),
                        condition: weatherText(current.weather_code),
                        humidity: Math.round(current.relative_humidity_2m),
                        wind: `${Math.round(current.wind_speed_10m)} mph`,
                        window: `${bestTime} training window`,
                    });
                }
            } catch {
                if (!cancelled) setWeather(fallbackWeather);
            } finally {
                if (!cancelled) setLoadingWeather(false);
            }
        }

        void loadWeather();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        void syncHealthSnapshot().catch(() => undefined);
        resetDailyIfNeeded();
    }, [resetDailyIfNeeded, syncHealthSnapshot]);

    const weeklyMinutes = weeklyWorkoutMinutes.reduce((sum, value) => sum + value, 0);
    const cardioProgress = Math.min(1, weeklyMinutes / 150);
    const stepsToday = latestSnapshot?.stepsToday ?? weeklySteps[weeklySteps.length - 1] ?? 0;
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todayNutrition = weeklyPlan[todayIndex] ?? weeklyPlan[0];
    const caloriesRemaining = Math.max(0, dailyGoals.calories - (todayNutrition?.totalCalories ?? 0));
    const proteinRemaining = Math.max(0, dailyGoals.protein - (todayNutrition?.totalProtein ?? 0));
    const waterProgress = Math.min(1, waterIntake / Math.max(1, dailyGoals.water));
    const readiness = useMemo(() => {
        const movement = Math.min(1, stepsToday / 9000);
        const training = Math.min(1, workoutLogs.length / 4);
        return Math.round(((cardioProgress + movement + training) / 3) * 100);
    }, [cardioProgress, stepsToday, workoutLogs.length]);

    const styles = makeStyles(colors, isDark);
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good morning, {user?.name?.split(' ')[0] || 'Athlete'}</Text>
                        <Text style={styles.title}>Today</Text>
                        <Text style={styles.subtitle}>{latestSnapshot ? `Wearable data imported from ${latestSnapshot.sourceLabel}` : 'Wearable metrics import when available.'}</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(user?.name || 'J').slice(0, 1).toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.segment}>
                    {(['Today', 'Fitness', 'Sleep', 'Nutrition'] as const).map((item) => (
                        <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.segmentButton, tab === item && styles.segmentActive]}>
                            <Text style={[styles.segmentText, tab === item && styles.segmentTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.primaryCard}>
                    <View style={styles.ring}>
                        <Text style={styles.ringValue}>{Math.round(cardioProgress * 100)}%</Text>
                        <Text style={styles.ringLabel}>Weekly cardio</Text>
                    </View>
                    <View style={styles.metricStack}>
                        <View style={styles.metricPill}>
                            <Ionicons name="footsteps-outline" size={24} color={colors.secondary} />
                            <View>
                                <Text style={styles.metricLabel}>Steps</Text>
                                <Text style={styles.metricValue}>{stepsToday.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.metricPill}>
                            <Ionicons name="heart-outline" size={24} color={colors.primary} />
                            <View>
                                <Text style={styles.metricLabel}>Readiness</Text>
                                <Text style={styles.metricValue}>{readiness}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.quickGrid}>
                    {[
                        ['Start workout', 'barbell-outline', '/workouts'],
                        ['Log food', 'restaurant-outline', '/nutrition/log-meal'],
                        ['View progress', 'trending-up-outline', '/analytics'],
                        ['Start run', 'walk-outline', '/run'],
                    ].map(([label, icon, href]) => (
                        <TouchableOpacity key={label} style={styles.quickCard} onPress={() => router.push(href as never)}>
                            <View style={styles.quickIcon}><Ionicons name={icon as any} size={23} color={colors.primary} /></View>
                            <Text style={styles.quickLabel}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.weatherCard}>
                    <View style={styles.weatherTop}>
                        <View>
                            <Text style={styles.metricLabel}>{weather.place}</Text>
                            <Text style={styles.weatherTemp}>{weather.temp}°</Text>
                            <Text style={styles.subtitle}>{weather.condition} · feels like {weather.feelsLike}°</Text>
                        </View>
                        <View style={styles.weatherIcon}>
                            {loadingWeather ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="partly-sunny-outline" size={34} color={colors.primary} />}
                        </View>
                    </View>
                    <LinearGradient colors={[gradients.primary[0] + '18', gradients.secondary[0] + '14']} style={styles.window}>
                        <View style={styles.goodDot} />
                        <View>
                            <Text style={styles.windowTitle}>{weather.window}</Text>
                            <Text style={styles.windowCopy}>Humidity {weather.humidity}% · Wind {weather.wind}</Text>
                        </View>
                    </LinearGradient>
                </View>

                {(tab === 'Today' || tab === 'Nutrition') ? (
                    <View style={styles.nutritionCard}>
                        <View style={styles.weatherTop}>
                            <View>
                                <Text style={styles.metricLabel}>Nutrition</Text>
                                <Text style={styles.sectionTitle}>Food and water</Text>
                                <Text style={styles.subtitle}>Daily intake without leaving Home.</Text>
                            </View>
                            <TouchableOpacity style={styles.addWaterButton} onPress={addWater}>
                                <Ionicons name="water-outline" size={20} color={colors.textInverse} />
                                <Text style={styles.addWaterText}>Water</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.nutritionMetrics}>
                            <View style={styles.nutritionMetric}><Text style={styles.metricValue}>{caloriesRemaining}</Text><Text style={styles.metricLabel}>kcal left</Text></View>
                            <View style={styles.nutritionMetric}><Text style={styles.metricValue}>{proteinRemaining}g</Text><Text style={styles.metricLabel}>protein left</Text></View>
                            <View style={styles.nutritionMetric}><Text style={styles.metricValue}>{waterIntake}/{dailyGoals.water}</Text><Text style={styles.metricLabel}>water</Text></View>
                        </View>
                        <View style={styles.waterTrack}><View style={[styles.waterFill, { width: `${waterProgress * 100}%` }]} /></View>
                        <TextInput value={foodDraft} onChangeText={setFoodDraft} placeholder="Food" placeholderTextColor={colors.textTertiary} style={styles.input} />
                        <View style={styles.inputRow}>
                            <TextInput value={calorieDraft} onChangeText={(value) => setCalorieDraft(value.replace(/[^\d.]/g, ''))} placeholder="kcal" keyboardType="number-pad" placeholderTextColor={colors.textTertiary} style={styles.input} />
                            <TextInput value={proteinDraft} onChangeText={(value) => setProteinDraft(value.replace(/[^\d.]/g, ''))} placeholder="protein" keyboardType="number-pad" placeholderTextColor={colors.textTertiary} style={styles.input} />
                            <TouchableOpacity style={styles.logButton} onPress={addFoodLog}>
                                <Ionicons name="add" size={20} color={colors.textInverse} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors'], isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 18, paddingBottom: 118, gap: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
    greeting: { color: colors.textSecondary, fontSize: 17, fontWeight: '800' },
    title: { color: colors.textPrimary, fontSize: 52, lineHeight: 56, fontWeight: '900', letterSpacing: -2 },
    subtitle: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, fontWeight: '600' },
    avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: colors.primary, fontSize: 24, fontWeight: '900' },
    segment: { flexDirection: 'row', gap: 8, marginTop: 6 },
    segmentButton: { flex: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
    segmentActive: { backgroundColor: colors.textPrimary },
    segmentText: { color: colors.textSecondary, fontSize: 15, fontWeight: '800' },
    segmentTextActive: { color: colors.textInverse },
    primaryCard: { flexDirection: 'row', gap: 18, padding: 18, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    ring: { width: 152, height: 152, borderRadius: 76, borderWidth: 18, borderColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    ringValue: { color: colors.textPrimary, fontSize: 25, fontWeight: '900' },
    ringLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
    metricStack: { flex: 1, gap: 12, justifyContent: 'center' },
    metricPill: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 26, backgroundColor: colors.surfaceLight },
    metricLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' },
    metricValue: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 2 },
    sectionTitle: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    quickCard: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 26, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    quickIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    quickLabel: { flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
    weatherCard: { padding: 18, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    weatherTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
    weatherTemp: { color: colors.textPrimary, fontSize: 58, lineHeight: 64, fontWeight: '900', letterSpacing: -2, marginTop: 8 },
    weatherIcon: { width: 64, height: 64, borderRadius: 24, backgroundColor: isDark ? colors.surfaceLight : '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    window: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, padding: 14 },
    goodDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary },
    windowTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
    windowCopy: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 3 },
    nutritionCard: { padding: 18, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 },
    addWaterButton: { borderRadius: 999, backgroundColor: colors.primary, minHeight: 42, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
    addWaterText: { color: colors.textInverse, fontSize: 14, fontWeight: '900' },
    nutritionMetrics: { flexDirection: 'row', gap: 9 },
    nutritionMetric: { flex: 1, borderRadius: 20, backgroundColor: colors.surfaceLight, padding: 12 },
    waterTrack: { height: 10, borderRadius: 999, backgroundColor: colors.surfaceLight, overflow: 'hidden' },
    waterFill: { height: 10, borderRadius: 999, backgroundColor: colors.secondary },
    input: { flex: 1, minHeight: 48, borderRadius: 18, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, paddingHorizontal: 13, fontSize: 15, fontWeight: '800' },
    inputRow: { flexDirection: 'row', gap: 9 },
    logButton: { width: 50, minHeight: 48, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
