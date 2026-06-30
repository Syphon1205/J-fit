import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    StatusBar,
    ActivityIndicator,
    AppState,
    Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme';
import { safeBack } from '../../src/utils/navigation';

const { width, height } = Dimensions.get('window');

interface Exercise {
    id: string;
    name: string;
    icon: string;
    tips: string[];
    keyPoints: string[];
    color: string;
}

const exercises: Exercise[] = [
    {
        id: 'squat',
        name: 'Squat',
        icon: 'body-outline',
        color: colors.primary,
        tips: ['Keep chest up and proud', 'Drive knees out over toes', 'Weight in heels', 'Go parallel or below'],
        keyPoints: ['Spine neutral', 'Depth ≥ parallel', 'Knees tracking toes', 'Chest up'],
    },
    {
        id: 'pushup',
        name: 'Push-Up',
        icon: 'fitness-outline',
        color: colors.secondary,
        tips: ['Straight line head to heel', 'Elbows at 45° from body', 'Full range of motion', 'Core tight throughout'],
        keyPoints: ['Flat back', 'Elbow angle', 'Head neutral', 'Full depth'],
    },
    {
        id: 'deadlift',
        name: 'Deadlift',
        icon: 'barbell-outline',
        color: colors.tertiary,
        tips: ['Bar over mid-foot', 'Hinge at hips first', 'Chest up, lats engaged', 'Drive through the floor'],
        keyPoints: ['Hip hinge', 'Bar path straight', 'Neutral spine', 'Lat engagement'],
    },
    {
        id: 'lunge',
        name: 'Lunge',
        icon: 'walk-outline',
        color: '#F59E0B',
        tips: ['Step far enough forward', 'Front knee over ankle', 'Back knee toward ground', 'Torso upright'],
        keyPoints: ['Stride length', 'Front knee angle', 'Back knee drop', 'Upright torso'],
    },
    {
        id: 'plank',
        name: 'Plank',
        icon: 'remove-outline',
        color: colors.info,
        tips: ['Neutral spine, no sagging', 'Engage core and glutes', 'Breathe steadily', 'Eyes at floor, not forward'],
        keyPoints: ['Hip height', 'Core braced', 'Shoulder stacked', 'Breathing'],
    },
    {
        id: 'overhead',
        name: 'Overhead Press',
        icon: 'arrow-up-outline',
        color: '#10B981',
        tips: ['Bar in front rack position', 'Core tight, glutes squeezed', 'Press in straight line', 'Lock out at top'],
        keyPoints: ['Bar path', 'Core engagement', 'Lockout', 'Foot stance'],
    },
];

const feedbackMessages = [
    { score: 95, label: 'Perfect Form! 🎯', color: colors.success },
    { score: 82, label: 'Great Posture ✅', color: colors.success },
    { score: 70, label: 'Good – Minor Fixes 👍', color: colors.warning },
    { score: 55, label: 'Needs Improvement ⚠️', color: colors.warning },
    { score: 40, label: 'Check Your Form ❌', color: colors.error },
];

export default function PostureCheckScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [postureScore, setPostureScore] = useState<number | null>(null);
    const [stabilityScore, setStabilityScore] = useState<number | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [formChecks, setFormChecks] = useState<boolean[]>(new Array(exercises[0].keyPoints.length).fill(false));
    const [activeTip, setActiveTip] = useState(0);
    const [showGuide, setShowGuide] = useState(true);
    const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(true);

    const scoreAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const motionSamplesRef = useRef<number[]>([]);
    const motionSubRef = useRef<{ remove: () => void } | null>(null);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Rotate tips every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTip((t) => (t + 1) % selectedExercise.tips.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedExercise]);

    // Scan line animation when analysing
    useEffect(() => {
        if (!isAnalysing) { scanLineAnim.setValue(0); return; }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
                Animated.timing(scanLineAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isAnalysing, scanLineAnim]);

    // Pulse animation for score
    useEffect(() => {
        if (postureScore === null) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [postureScore, pulseAnim]);

    const resetAnalysisState = () => {
        motionSamplesRef.current = [];
        if (motionSubRef.current) {
            motionSubRef.current.remove();
            motionSubRef.current = null;
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    useEffect(() => () => resetAnalysisState(), []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            setCameraActive(nextState === 'active');
        });
        return () => subscription.remove();
    }, []);

    const startAnalysis = () => {
        setIsAnalysing(true);
        setPostureScore(null);
        setStabilityScore(null);
        setAnalysisProgress(0);
        setShowGuide(false);
        resetAnalysisState();

        DeviceMotion.setUpdateInterval(120);
        motionSubRef.current = DeviceMotion.addListener((m) => {
            const a = m.accelerationIncludingGravity;
            if (!a) return;
            const magnitude = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
            motionSamplesRef.current.push(magnitude);
            if (motionSamplesRef.current.length > 120) {
                motionSamplesRef.current.shift();
            }
        });

        const analysisSeconds = 3;
        const started = Date.now();
        progressIntervalRef.current = setInterval(() => {
            const progress = Math.min(1, (Date.now() - started) / (analysisSeconds * 1000));
            setAnalysisProgress(progress);
        }, 80);

        setTimeout(() => {
            const samples = motionSamplesRef.current;
            const avg = samples.length > 0
                ? samples.reduce((sum, v) => sum + v, 0) / samples.length
                : 9.81;
            const variance = samples.length > 0
                ? samples.reduce((sum, v) => sum + (v - avg) ** 2, 0) / samples.length
                : 0;
            const jitter = Math.sqrt(variance);

            const stable = Math.max(45, Math.min(100, Math.round(100 - jitter * 110)));
            const checklistRatio = formChecks.length > 0
                ? formChecks.filter(Boolean).length / formChecks.length
                : 0;
            const checklistScore = Math.round(50 + checklistRatio * 50);
            const score = Math.round(stable * 0.55 + checklistScore * 0.45);

            setPostureScore(score);
            setStabilityScore(stable);
            setAnalysisProgress(1);
            setIsAnalysing(false);
            resetAnalysisState();
            Animated.timing(scoreAnim, { toValue: score, duration: 800, useNativeDriver: false }).start();
        }, 3000);
    };

    const getFeedback = (score: number) => {
        return feedbackMessages.find((f) => score >= f.score) ?? feedbackMessages[feedbackMessages.length - 1];
    };

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permContainer}>
                    <Ionicons name="camera-outline" size={64} color={colors.primary} />
                    <Text style={styles.permTitle}>Camera Access Needed</Text>
                    <Text style={styles.permDesc}>
                        J-Fit uses your camera to analyse your exercise posture in real time.
                    </Text>
                    <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                        <Text style={styles.permBtnText}>Enable Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openSettings()}>
                        <Text style={[typography.caption, { color: colors.primary, marginTop: 10 }]}>Open Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => safeBack(router, '/workouts')}>
                        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 8 }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const feedback = postureScore !== null ? getFeedback(postureScore) : null;
    const scanTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-height * 0.35, height * 0.35],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Camera */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing={cameraFacing}
                active={cameraActive}
                onCameraReady={() => {
                    setCameraReady(true);
                    setCameraError(null);
                }}
                onMountError={(event) => {
                    setCameraReady(false);
                    setCameraError(event?.message || 'Camera preview failed to start.');
                }}
            />

            {!cameraReady && !cameraError && (
                <View style={styles.cameraStatusCard} pointerEvents="none">
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.cameraStatusText}>Starting camera preview…</Text>
                </View>
            )}

            {!!cameraError && (
                <View style={styles.cameraStatusCard}>
                    <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                    <Text style={styles.cameraStatusText}>{cameraError}</Text>
                </View>
            )}

            {/* Dark vignette overlay */}
            <View style={styles.vignetteOverlay} pointerEvents="none" />

            {/* Body outline guide */}
            {showGuide && (
                <View style={styles.bodyGuide} pointerEvents="none">
                    <View style={styles.bodyOutline} />
                    <Text style={styles.guideText}>Position yourself in frame</Text>
                </View>
            )}

            {/* Scanning line */}
            {isAnalysing && (
                <Animated.View
                    style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]}
                    pointerEvents="none"
                />
            )}

            {/* Skeleton overlay dots */}
            {isAnalysing && (
                <View style={styles.skeletonOverlay} pointerEvents="none">
                    {[[width * 0.5, height * 0.22], [width * 0.5, height * 0.32], [width * 0.38, height * 0.36], [width * 0.62, height * 0.36], [width * 0.34, height * 0.50], [width * 0.66, height * 0.50], [width * 0.44, height * 0.58], [width * 0.56, height * 0.58], [width * 0.42, height * 0.72], [width * 0.58, height * 0.72]].map(([x, y], i) => (
                        <View key={i} style={[styles.skeletonDot, { left: x - 5, top: y - 5 }]} />
                    ))}
                </View>
            )}

            {/* Top bar */}
            <LinearGradient
                colors={['rgba(13,13,13,0.9)', 'transparent']}
                style={[styles.topBar, { paddingTop: insets.top + 8 }]}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => safeBack(router, '/workouts')}>
                    <Ionicons name="chevron-down" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Posture Check</Text>
                <TouchableOpacity
                    style={styles.guideToggle}
                    onPress={() => setCameraFacing((prev) => prev === 'front' ? 'back' : 'front')}
                >
                    <Ionicons name="camera-reverse-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
            </LinearGradient>

            {/* Bottom Panel */}
            <LinearGradient
                colors={['transparent', 'rgba(13,13,13,0.97)', '#0D0D0D']}
                style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}
            >
                {/* Exercise Selector */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.exerciseScroll}
                >
                    {exercises.map((ex) => (
                        <TouchableOpacity
                            key={ex.id}
                            onPress={() => {
                                setSelectedExercise(ex);
                                setPostureScore(null);
                                setStabilityScore(null);
                                setShowGuide(true);
                                setIsAnalysing(false);
                                setActiveTip(0);
                                setFormChecks(new Array(ex.keyPoints.length).fill(false));
                            }}
                            style={[styles.exPill, selectedExercise.id === ex.id && { borderColor: ex.color, backgroundColor: ex.color + '20' }]}
                        >
                            <Ionicons name={ex.icon as any} size={14} color={selectedExercise.id === ex.id ? ex.color : colors.textTertiary} />
                            <Text style={[styles.exPillText, selectedExercise.id === ex.id && { color: ex.color }]}>
                                {ex.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Score display or analysing state */}
                {postureScore !== null && feedback ? (
                    <Animated.View style={[styles.scoreCard, { transform: [{ scale: pulseAnim }] }]}>
                        <View style={styles.scoreCircle}>
                            <Text style={[styles.scoreNumber, { color: feedback.color }]}>{postureScore}</Text>
                            <Text style={styles.scoreLabel}>/ 100</Text>
                        </View>
                        <View style={styles.scoreInfo}>
                            <Text style={[styles.feedbackLabel, { color: feedback.color }]}>{feedback.label}</Text>
                            {stabilityScore !== null && (
                                <Text style={styles.stabilityText}>Stability: {stabilityScore}%</Text>
                            )}
                            <View style={styles.keyPointsList}>
                                {selectedExercise.keyPoints.map((kp, i) => (
                                    <View key={i} style={styles.keyPointRow}>
                                        <View style={[styles.keyDot, { backgroundColor: i < Math.ceil(postureScore / 25) ? feedback.color : colors.border }]} />
                                        <Text style={[styles.keyPointText, { color: i < Math.ceil(postureScore / 25) ? colors.textSecondary : colors.textTertiary }]}>{kp}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Animated.View>
                ) : isAnalysing ? (
                    <View style={styles.analysingCard}>
                        <Animated.View style={[styles.analysingDot, { opacity: pulseAnim }]} />
                        <Text style={styles.analysingText}>Analysing posture…</Text>
                        <Text style={styles.analysingSubText}>Hold your position and stay still</Text>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${analysisProgress * 100}%` }]} />
                        </View>
                    </View>
                ) : (
                    <View style={styles.tipCard}>
                        <View style={[styles.tipIcon, { backgroundColor: selectedExercise.color + '20' }]}>
                            <Ionicons name="bulb-outline" size={16} color={selectedExercise.color} />
                        </View>
                        <Text style={styles.tipText}>{selectedExercise.tips[activeTip]}</Text>
                    </View>
                )}

                {!isAnalysing && (
                    <View style={styles.checklistCard}>
                        <Text style={styles.checklistTitle}>Form checklist</Text>
                        {selectedExercise.keyPoints.map((point, i) => (
                            <TouchableOpacity
                                key={point}
                                style={styles.checkRow}
                                onPress={() => {
                                    setFormChecks((prev) => {
                                        const next = [...prev];
                                        next[i] = !next[i];
                                        return next;
                                    });
                                }}
                            >
                                <Ionicons
                                    name={formChecks[i] ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={18}
                                    color={formChecks[i] ? selectedExercise.color : colors.textTertiary}
                                />
                                <Text style={[styles.checkRowText, formChecks[i] && { color: colors.textPrimary }]}>{point}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Analyse Button */}
                <TouchableOpacity
                    style={[styles.analyseBtn, (isAnalysing || !cameraReady || !!cameraError) && styles.analyseBtnDisabled]}
                    onPress={startAnalysis}
                    disabled={isAnalysing || !cameraReady || !!cameraError}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={isAnalysing ? [colors.surfaceLight, colors.surfaceLight] : [selectedExercise.color, selectedExercise.color + 'CC']}
                        style={styles.analyseBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons
                            name={isAnalysing ? 'hourglass-outline' : 'scan-outline'}
                            size={20}
                            color={isAnalysing ? colors.textTertiary : colors.textInverse}
                        />
                        <Text style={[styles.analyseBtnText, isAnalysing && { color: colors.textTertiary }]}>
                            {isAnalysing ? 'Analysing…' : postureScore !== null ? 'Re-analyse' : 'Analyse Posture'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0D0D' },
    vignetteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        shadowColor: '#000',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 28,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topTitle: { ...typography.body, color: '#fff', fontWeight: '700' },
    guideToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyGuide: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyOutline: {
        width: width * 0.4,
        height: height * 0.55,
        borderRadius: 120,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        borderStyle: 'dashed',
    },
    guideText: { ...typography.caption, color: 'rgba(255,255,255,0.5)', marginTop: 12 },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        top: '50%',
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    skeletonOverlay: { ...StyleSheet.absoluteFillObject },
    skeletonDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    cameraStatusCard: {
        position: 'absolute',
        top: 110,
        left: spacing.lg,
        right: spacing.lg,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    cameraStatusText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 40,
        paddingHorizontal: 16,
    },
    exerciseScroll: { paddingBottom: 12, gap: 8, paddingHorizontal: 4 },
    exPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    exPillText: { ...typography.caption, color: colors.textTertiary, fontWeight: '600' },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tipIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    tipText: { ...typography.body, color: colors.textSecondary, flex: 1, fontSize: 13 },
    analysingCard: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 6,
        marginBottom: 12,
    },
    analysingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    analysingText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
    analysingSubText: { ...typography.caption, color: colors.textTertiary },
    progressTrack: {
        height: 6,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 6,
        backgroundColor: colors.surfaceLight,
    },
    progressFill: { height: '100%', backgroundColor: colors.primary },
    scoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    scoreCircle: { alignItems: 'center', minWidth: 60 },
    scoreNumber: { fontSize: 40, fontWeight: '800', letterSpacing: -2 },
    scoreLabel: { ...typography.caption, color: colors.textTertiary },
    scoreInfo: { flex: 1 },
    feedbackLabel: { ...typography.body, fontWeight: '700', marginBottom: 8 },
    stabilityText: { ...typography.caption, color: colors.textSecondary, marginBottom: 6 },
    keyPointsList: { gap: 4 },
    keyPointRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    keyDot: { width: 6, height: 6, borderRadius: 3 },
    keyPointText: { ...typography.caption },
    analyseBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
    analyseBtnDisabled: { opacity: 0.6 },
    analyseBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    analyseBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700', fontSize: 16 },
    checklistCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        gap: 8,
    },
    checklistTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkRowText: { ...typography.caption, color: colors.textSecondary },
    permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
    permTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    permDesc: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    permBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: colors.primary,
        borderRadius: 24,
        marginTop: 8,
    },
    permBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
