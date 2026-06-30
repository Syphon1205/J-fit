import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedGradientBackgroundProps {
    style?: ViewStyle;
    intensity?: number;
}

export const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
    style,
    intensity = 0.16,
}) => {
    const drift = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(drift, { toValue: 1, duration: 9000, useNativeDriver: true }),
                Animated.timing(drift, { toValue: 0, duration: 9000, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [drift]);

    const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
    const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [20, -20] });

    return (
        <Animated.View style={[styles.container, style, { opacity: intensity }]}> 
            <AnimatedLinearGradient
                colors={[colors.primary + '55', colors.secondary + '22', colors.tertiary + '33']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { transform: [{ translateX }, { translateY }] }]}
            />
            <AnimatedLinearGradient
                colors={[colors.secondary + '33', colors.primary + '22', colors.surface]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.gradient, { transform: [{ translateX: Animated.multiply(translateX, -1) }, { translateY: Animated.multiply(translateY, -1) }] }]}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
});
