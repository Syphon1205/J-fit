export type WeatherWorkoutPlan = {
    recommendedWorkout: string;
    originalWorkout: string;
    heatIndex: number;
    reasoning: string;
};

type WeatherReadinessInput = {
    currentTemp: number;
    humidity: number;
    severeWeatherRisk: boolean;
    plannedWorkoutType: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const calculateHeatIndex = (tempF: number, humidity: number) => {
    const T = tempF;
    const R = humidity;
    const hi =
        -42.379 +
        2.04901523 * T +
        10.14333127 * R -
        0.22475541 * T * R -
        0.00683783 * T * T -
        0.05481717 * R * R +
        0.00122874 * T * T * R +
        0.00085282 * T * R * R -
        0.00000199 * T * T * R * R;

    return Math.round(hi);
};

export function adjustWorkoutForWeather(input: WeatherReadinessInput): WeatherWorkoutPlan {
    const heatIndex = calculateHeatIndex(input.currentTemp, clamp(input.humidity, 0, 100));
    const originalWorkout = input.plannedWorkoutType.trim() || 'Outdoor 5K';

    const isOutdoor = /outdoor|run|ride|trail|field/i.test(originalWorkout);
    const severe = input.severeWeatherRisk;
    const extremeHeat = heatIndex >= 95;

    if (severe || extremeHeat) {
        const recommendedWorkout = isOutdoor
            ? 'Indoor Cunningham Mobility Flow'
            : 'Low-Impact Cunningham Recovery Circuit';
        const reasoning = severe
            ? 'Severe weather risk detected. Swap to an indoor recovery-focused session to protect consistency.'
            : `Heat index ${heatIndex}°F is in the danger zone. Shift to indoor work to reduce thermal strain.`;

        return {
            recommendedWorkout,
            originalWorkout,
            heatIndex,
            reasoning,
        };
    }

    return {
        recommendedWorkout: originalWorkout,
        originalWorkout,
        heatIndex,
        reasoning: 'Conditions are stable. Execute the planned session with your usual intent.',
    };
}
