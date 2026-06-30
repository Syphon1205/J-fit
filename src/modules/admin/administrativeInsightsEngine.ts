export interface ClientTelemetrySnapshot {
    clientId: string;
    clientName: string;
    scheduledSessions14d: number;
    completedSessions14d: number;
    averageWorkoutIntensityNow: number; // 0-100
    averageWorkoutIntensityPrevious: number; // 0-100
    appOpensNow: number;
    appOpensPrevious: number;
    nutritionLogsNow: number;
    nutritionLogsPrevious: number;
    checkInResponseHours: number;
    lastActiveAt: string;
}

export type OutreachType = 'none' | 'nudge' | 'coach_message' | 'personal_check_in' | 'urgent_reachout';

export interface ClientHealthInsight {
    clientId: string;
    clientName: string;
    clientHealthScore: number;
    silentChurnRisk: number;
    needsPersonalCheckIn: boolean;
    outreachType: OutreachType;
    reasons: string[];
}

export interface AdministrativeInsightsReport {
    generatedAt: string;
    flaggedClients: ClientHealthInsight[];
    summary: {
        totalClients: number;
        flaggedCount: number;
        urgentCount: number;
        averageHealthScore: number;
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function percentDelta(current: number, previous: number) {
    if (previous <= 0 && current <= 0) return 0;
    if (previous <= 0) return 1;
    return (current - previous) / previous;
}

export function calculateClientHealthInsight(snapshot: ClientTelemetrySnapshot): ClientHealthInsight {
    const adherence = snapshot.scheduledSessions14d > 0
        ? snapshot.completedSessions14d / snapshot.scheduledSessions14d
        : 0;

    const intensityDelta = percentDelta(snapshot.averageWorkoutIntensityNow, snapshot.averageWorkoutIntensityPrevious);
    const opensDelta = percentDelta(snapshot.appOpensNow, snapshot.appOpensPrevious);
    const nutritionDelta = percentDelta(snapshot.nutritionLogsNow, snapshot.nutritionLogsPrevious);
    const latencyPenalty = clamp(snapshot.checkInResponseHours / 72, 0, 1);
    const inactivityHours = Math.max(0, (Date.now() - new Date(snapshot.lastActiveAt).getTime()) / 36e5);
    const inactivityPenalty = clamp(inactivityHours / 120, 0, 1);

    const silentChurnRisk = Math.round(clamp(
        ((1 - adherence) * 0.35
            + Math.max(0, -intensityDelta) * 0.2
            + Math.max(0, -opensDelta) * 0.15
            + Math.max(0, -nutritionDelta) * 0.1
            + latencyPenalty * 0.1
            + inactivityPenalty * 0.1) * 100,
        0,
        100
    ));

    const clientHealthScore = 100 - silentChurnRisk;
    const reasons: string[] = [];

    if (adherence < 0.75) reasons.push('Session adherence has dropped below 75% over the last 14 days.');
    if (intensityDelta <= -0.2) reasons.push('Workout intensity is trending downward versus the previous period.');
    if (opensDelta <= -0.25) reasons.push('App engagement has declined materially.');
    if (nutritionDelta <= -0.25) reasons.push('Nutrition logging consistency is fading.');
    if (snapshot.checkInResponseHours >= 48) reasons.push('Check-in responses are delayed, suggesting reduced engagement.');
    if (inactivityHours >= 72) reasons.push('Recent inactivity suggests the client may be slipping into silent churn.');

    const outreachType: OutreachType =
        silentChurnRisk >= 80 ? 'urgent_reachout'
            : silentChurnRisk >= 65 ? 'personal_check_in'
                : silentChurnRisk >= 45 ? 'coach_message'
                    : silentChurnRisk >= 30 ? 'nudge'
                        : 'none';

    return {
        clientId: snapshot.clientId,
        clientName: snapshot.clientName,
        clientHealthScore,
        silentChurnRisk,
        needsPersonalCheckIn: outreachType === 'personal_check_in' || outreachType === 'urgent_reachout',
        outreachType,
        reasons,
    };
}

export function generateAdministrativeInsightsReport(snapshots: ClientTelemetrySnapshot[]): AdministrativeInsightsReport {
    const flaggedClients = snapshots
        .map(calculateClientHealthInsight)
        .filter((client) => client.outreachType !== 'none')
        .sort((a, b) => b.silentChurnRisk - a.silentChurnRisk);

    const totalClients = snapshots.length;
    const averageHealthScore = totalClients === 0
        ? 0
        : Math.round(snapshots.map(calculateClientHealthInsight).reduce((sum, item) => sum + item.clientHealthScore, 0) / totalClients);

    return {
        generatedAt: new Date().toISOString(),
        flaggedClients,
        summary: {
            totalClients,
            flaggedCount: flaggedClients.length,
            urgentCount: flaggedClients.filter((client) => client.outreachType === 'urgent_reachout').length,
            averageHealthScore,
        },
    };
}
