import React from 'react';
import { Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';

type MotionBaseProps = {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
};

type MotionPressableProps = MotionBaseProps & PressableProps;

export function MotionPressable({ style, children, onPress, disabled, ...rest }: MotionPressableProps) {
    return (
        <Pressable onPress={onPress} disabled={disabled} style={style} {...rest}>
            {children}
        </Pressable>
    );
}

export function MotionView({ style, children }: MotionBaseProps) {
    return <View style={style}>{children}</View>;
}