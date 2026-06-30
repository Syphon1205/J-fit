import React, { useMemo, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Button, Input } from '../../src/components/ui';
import { useAuthStore, User } from '../../src/stores/authStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { safeBack } from '../../src/utils/navigation';

const fitnessGoalOptions: Array<{ id: User['fitnessGoal']; label: string }> = [
    { id: 'lose_weight', label: 'Lose Weight' },
    { id: 'build_muscle', label: 'Build Muscle' },
    { id: 'stay_fit', label: 'Stay Fit' },
    { id: 'improve_endurance', label: 'Improve Endurance' },
];

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateProfile } = useAuthStore();
    const addWeight = useProgressStore((state) => state.addWeight);

    const [name, setName] = useState(user?.name ?? '');
    const [height, setHeight] = useState(user?.height?.toString() ?? '');
    const [weight, setWeight] = useState(user?.weight?.toString() ?? '');
    const [goalWeight, setGoalWeight] = useState(user?.goalWeight?.toString() ?? '');
    const [fitnessGoal, setFitnessGoal] = useState<User['fitnessGoal']>(user?.fitnessGoal ?? 'stay_fit');
    const [avatar, setAvatar] = useState(user?.avatar ?? '');

    const canSave = useMemo(() => name.trim().length > 0, [name]);

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No user loaded.</Text>
                    <Button title="Back" variant="secondary" onPress={() => safeBack(router, '/profile')} />
                </View>
            </SafeAreaView>
        );
    }

    const onSave = () => {
        if (!canSave) {
            Alert.alert('Name required', 'Please enter your name.');
            return;
        }

        const parsedHeight = Number(height);
        const parsedWeight = Number(weight);
        const parsedGoalWeight = Number(goalWeight);
        const nextWeight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : user.weight;

        updateProfile({
            name,
            avatar: avatar || undefined,
            height: Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : user.height,
            weight: nextWeight,
            goalWeight: Number.isFinite(parsedGoalWeight) && parsedGoalWeight > 0 ? parsedGoalWeight : undefined,
            fitnessGoal,
        });
        if (nextWeight !== user.weight) {
            addWeight({ date: new Date().toISOString().split('T')[0], value: nextWeight });
        }

        Alert.alert('Saved', 'Profile updated successfully.');
        safeBack(router, '/profile');
    };

    const pickFromLibrary = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow photo library access to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            aspect: [1, 1],
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setAvatar(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow camera access to take a profile picture.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
            aspect: [1, 1],
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setAvatar(result.assets[0].uri);
        }
    };

    const showAvatarActions = () => {
        Alert.alert('Profile Picture', 'Choose an option', [
            { text: 'Take Photo', onPress: takePhoto },
            { text: 'Choose from Library', onPress: pickFromLibrary },
            ...(avatar ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => setAvatar('') }] : []),
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/profile')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Edit Profile</Text>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <Card style={styles.avatarCard}>
                    <TouchableOpacity style={styles.avatarBtn} onPress={showAvatarActions} activeOpacity={0.88}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarFallbackText}>{(name.trim().charAt(0) || 'U').toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={styles.avatarEditBadge}>
                            <Ionicons name="camera" size={14} color={colors.textInverse} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Tap to upload profile photo</Text>
                </Card>

                <Card style={styles.card}>
                    <Input
                        label="Display Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        autoCapitalize="words"
                        textContentType="name"
                        returnKeyType="done"
                    />
                    <Input
                        label="Height (cm)"
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder="178"
                        returnKeyType="done"
                    />
                    <Input
                        label="Weight (kg)"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholder="76"
                        returnKeyType="done"
                    />
                    <Input
                        label="Goal Weight (kg)"
                        value={goalWeight}
                        onChangeText={setGoalWeight}
                        keyboardType="numeric"
                        placeholder="73"
                        returnKeyType="done"
                        onSubmitEditing={onSave}
                    />
                </Card>

                <Text style={styles.sectionTitle}>Fitness Goal</Text>
                <Card style={[styles.card, { padding: 0 }]}> 
                    {fitnessGoalOptions.map((item, i) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.goalRow, i < fitnessGoalOptions.length - 1 && styles.goalBorder]}
                            onPress={() => setFitnessGoal(item.id)}
                        >
                            <Text style={styles.goalLabel}>{item.label}</Text>
                            <Ionicons
                                name={fitnessGoal === item.id ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={fitnessGoal === item.id ? colors.primary : colors.textTertiary}
                            />
                        </TouchableOpacity>
                    ))}
                </Card>

                <Button title="Save Changes" onPress={onSave} disabled={!canSave} style={styles.saveBtn} />
                <View style={{ height: 24 }} />
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topTitle: { ...typography.h3, color: colors.textPrimary },
    content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
    avatarCard: { padding: 14, alignItems: 'center' },
    avatarBtn: { position: 'relative' },
    avatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: colors.primary + '60',
    },
    avatarFallback: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primaryGlow,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary + '60',
    },
    avatarFallbackText: { ...typography.h1, color: colors.primary },
    avatarEditBadge: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    avatarHint: { ...typography.caption, color: colors.textSecondary, marginTop: 8 },
    card: { padding: 14 },
    sectionTitle: {
        ...typography.caption,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginTop: 6,
    },
    goalRow: {
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    goalBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    goalLabel: { ...typography.body, color: colors.textPrimary },
    saveBtn: { marginTop: 12 },
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
    emptyText: { ...typography.body, color: colors.textSecondary },
});
