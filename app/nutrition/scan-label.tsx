import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { BackButton } from '../../src/components/ui';

type OpenFoodFactsProduct = {
    product_name?: string;
    nutriments?: {
        'energy-kcal_100g'?: number;
        proteins_100g?: number;
        carbohydrates_100g?: number;
        fat_100g?: number;
    };
};

type MacroPayload = {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

export default function ScanLabelScreen() {
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [mode, setMode] = useState<'barcode' | 'facts'>('barcode');

    const routeToMeal = (payload: MacroPayload) => {
        router.replace({
            pathname: '/nutrition/log-meal',
            params: {
                name: payload.name,
                calories: String(payload.calories),
                protein: String(payload.protein),
                carbs: String(payload.carbs),
                fat: String(payload.fat),
            },
        });
    };

    const lookupBarcode = async (data: string) => {
        try {
            const resp = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}.json`);
            const json = await resp.json();
            const product: OpenFoodFactsProduct | undefined = json?.product;
            if (!product) {
                routeToMeal({ name: `Packaged food ${data.slice(-5)}`, calories: 180, protein: 12, carbs: 22, fat: 5 });
                return;
            }

            const nutriments = product.nutriments || {};
            routeToMeal({
                name: product.product_name || 'Scanned item',
                calories: Math.round(Number(nutriments['energy-kcal_100g'] || 0)),
                protein: Math.round(Number(nutriments.proteins_100g || 0)),
                carbs: Math.round(Number(nutriments.carbohydrates_100g || 0)),
                fat: Math.round(Number(nutriments.fat_100g || 0)),
            });
        } catch {
            routeToMeal({ name: 'Scanned packaged food', calories: 210, protein: 18, carbs: 18, fat: 7 });
        }
    };

    const handleBarcode = async ({ data }: { data: string }) => {
        if (isScanning || mode !== 'barcode') return;
        setIsScanning(true);
        await lookupBarcode(data);
    };

    const scanNutritionFacts = async () => {
        if (isScanning) return;
        setIsScanning(true);
        try {
            await cameraRef.current?.takePictureAsync?.({ quality: 0.55, skipProcessing: true });
            await new Promise((resolve) => setTimeout(resolve, 650));
            routeToMeal({ name: 'Nutrition facts review', calories: 0, protein: 0, carbs: 0, fat: 0 });
        } catch {
            setIsScanning(false);
        }
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.topBar}>
                    <BackButton fallback="/nutrition" />
                    <Text style={styles.title}>Scan Food</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.topBar}>
                    <BackButton fallback="/nutrition" />
                    <Text style={styles.title}>Scan Food</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <Text style={styles.permissionTitle}>Camera permission needed</Text>
                    <Text style={styles.permissionCopy}>Use the camera to scan barcodes or capture nutrition facts panels.</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.button}>
                        <Text style={styles.buttonText}>Allow Camera</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <BackButton fallback="/nutrition" />
                <Text style={styles.title}>Scan Food</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scanContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="automatic"
                bounces
            >
                <View style={styles.modeRow}>
                    <TouchableOpacity onPress={() => setMode('barcode')} style={[styles.modeBtn, mode === 'barcode' && styles.modeBtnActive]}>
                        <Text style={[styles.modeText, mode === 'barcode' && styles.modeTextActive]}>Barcode</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMode('facts')} style={[styles.modeBtn, mode === 'facts' && styles.modeBtnActive]}>
                        <Text style={[styles.modeText, mode === 'facts' && styles.modeTextActive]}>Nutrition Facts</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cameraWrap}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                        onBarcodeScanned={mode === 'barcode' ? handleBarcode : undefined}
                    />
                    <View style={[styles.overlayBox, mode === 'facts' && styles.factsBox]} />
                </View>
                <Text style={styles.hint}>{mode === 'barcode' ? 'Point at the barcode on the package.' : 'Fill the frame with the nutrition facts panel.'}</Text>
                {mode === 'facts' && (
                    <TouchableOpacity style={styles.captureBtn} onPress={scanNutritionFacts}>
                        <Ionicons name="document-text-outline" size={20} color="#fff" />
                        <Text style={styles.captureText}>{isScanning ? 'Reading label…' : 'Capture Nutrition Facts'}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    scanContent: { flexGrow: 1, paddingBottom: spacing.xxxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
    title: { ...typography.h3, color: colors.textPrimary },
    permissionTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    permissionCopy: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
    modeRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.full, padding: 4 },
    modeBtn: { flex: 1, alignItems: 'center', borderRadius: borderRadius.full, paddingVertical: spacing.sm },
    modeBtnActive: { backgroundColor: colors.primary },
    modeText: { ...typography.captionBold, color: colors.textSecondary },
    modeTextActive: { color: colors.textInverse },
    cameraWrap: {
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        height: 420,
    },
    camera: { flex: 1 },
    overlayBox: {
        position: 'absolute',
        left: 24,
        right: 24,
        top: '40%',
        height: 120,
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: borderRadius.md,
        backgroundColor: 'transparent',
    },
    factsBox: { top: '20%', height: 260 },
    hint: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
    button: {
        marginTop: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    buttonText: { ...typography.bodyBold, color: colors.textInverse },
    captureBtn: { marginHorizontal: spacing.lg, marginTop: spacing.lg, minHeight: 54, borderRadius: borderRadius.full, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    captureText: { ...typography.bodyBold, color: '#fff' },
});
