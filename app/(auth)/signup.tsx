import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to login since we only support OAuth
        router.replace('/(auth)/login');
    }, []);

    return null;
}
