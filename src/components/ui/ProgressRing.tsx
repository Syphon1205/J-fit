import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme';

interface ProgressRingProps {
    size: number;
    strokeWidth: number;
    progress: number; // 0-1
    color: string;
    bgColor?: string;
    children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    size,
    strokeWidth,
    progress,
    color,
    bgColor,
    children,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(progress, 1)) : 0;
    const strokeDashoffset = circumference * (1 - safeProgress);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Background ring */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={bgColor || 'rgba(255,255,255,0.08)'}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress ring */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                />
            </Svg>
            {children && (
                <View style={styles.childContainer}>
                    {children}
                </View>
            )}
        </View>
    );
};

interface ActivityRingsProps {
    size?: number;
    move: number;
    exercise: number;
    stand: number;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
    size = 140,
    move,
    exercise,
    stand,
}) => {
    const ringGap = 4;
    const strokeWidth = 12;
    const outerSize = size;
    const midSize = size - (strokeWidth * 2 + ringGap * 2);
    const innerSize = size - (strokeWidth * 4 + ringGap * 4);

    return (
        <View style={[styles.container, { width: outerSize, height: outerSize }]}>
            <View style={[styles.ringLayer, { width: outerSize, height: outerSize }]}>
                <ProgressRing
                    size={outerSize}
                    strokeWidth={strokeWidth}
                    progress={move}
                    color={colors.ringMove}
                />
            </View>
            <View style={[styles.ringLayer, styles.centered]}>
                <ProgressRing
                    size={midSize}
                    strokeWidth={strokeWidth}
                    progress={exercise}
                    color={colors.ringExercise}
                />
            </View>
            <View style={[styles.ringLayer, styles.centered]}>
                <ProgressRing
                    size={innerSize}
                    strokeWidth={strokeWidth}
                    progress={stand}
                    color={colors.ringStand}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    childContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringLayer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centered: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});
