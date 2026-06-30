export type SyncEntity =
    | 'workout_log'
    | 'nutrition_log'
    | 'health_signal'
    | 'coaching_decision'
    | 'admin_note'
    | 'profile';

export type SyncOperation = 'upsert' | 'delete';
export type SyncStatus = 'pending' | 'syncing' | 'acked' | 'failed' | 'conflicted';

export interface LocalSyncEvent<TPayload = unknown> {
    id: string;
    entity: SyncEntity;
    entityId: string;
    operation: SyncOperation;
    payload: TPayload;
    createdAt: string;
    updatedAt: string;
    version: number;
    deviceId: string;
    status: SyncStatus;
    retryCount: number;
}

export interface SyncConflict<TPayload = unknown> {
    entity: SyncEntity;
    entityId: string;
    local: LocalSyncEvent<TPayload>;
    remote: {
        payload: TPayload;
        version: number;
        updatedAt: string;
    };
    strategy: 'last_write_wins' | 'field_merge' | 'manual_review';
}

export interface SyncSnapshot<TMaterialized = unknown> {
    eventLog: LocalSyncEvent[];
    materializedView: Record<string, TMaterialized>;
    pendingCount: number;
    failedCount: number;
    conflictCount: number;
}

function materializedKey(entity: SyncEntity, entityId: string) {
    return `${entity}:${entityId}`;
}

export function appendLocalEvent<TPayload, TMaterialized = TPayload>(
    snapshot: SyncSnapshot<TMaterialized>,
    event: LocalSyncEvent<TPayload>
): SyncSnapshot<TMaterialized> {
    const nextEventLog = [...snapshot.eventLog, event];
    const key = materializedKey(event.entity, event.entityId);
    const nextView = { ...snapshot.materializedView };

    if (event.operation === 'delete') {
        delete nextView[key];
    } else {
        nextView[key] = event.payload as unknown as TMaterialized;
    }

    return {
        eventLog: nextEventLog,
        materializedView: nextView,
        pendingCount: nextEventLog.filter((item) => item.status === 'pending' || item.status === 'syncing').length,
        failedCount: nextEventLog.filter((item) => item.status === 'failed').length,
        conflictCount: nextEventLog.filter((item) => item.status === 'conflicted').length,
    };
}

export function markEventStatus<TMaterialized>(
    snapshot: SyncSnapshot<TMaterialized>,
    eventId: string,
    status: SyncStatus
): SyncSnapshot<TMaterialized> {
    const eventLog = snapshot.eventLog.map((event) =>
        event.id === eventId
            ? { ...event, status, updatedAt: new Date().toISOString(), retryCount: status === 'failed' ? event.retryCount + 1 : event.retryCount }
            : event
    );

    return {
        ...snapshot,
        eventLog,
        pendingCount: eventLog.filter((item) => item.status === 'pending' || item.status === 'syncing').length,
        failedCount: eventLog.filter((item) => item.status === 'failed').length,
        conflictCount: eventLog.filter((item) => item.status === 'conflicted').length,
    };
}

export function detectSyncConflict<TPayload>(
    local: LocalSyncEvent<TPayload>,
    remote: { version: number; updatedAt: string; payload: TPayload }
): SyncConflict<TPayload> | null {
    if (remote.version <= local.version) return null;

    return {
        entity: local.entity,
        entityId: local.entityId,
        local,
        remote,
        strategy: local.entity === 'profile' ? 'field_merge' : 'last_write_wins',
    };
}

export function resolveSyncConflict<TPayload, TMaterialized = TPayload>(
    snapshot: SyncSnapshot<TMaterialized>,
    conflict: SyncConflict<TPayload>
): SyncSnapshot<TMaterialized> {
    const key = materializedKey(conflict.entity, conflict.entityId);
    const nextView = { ...snapshot.materializedView };

    if (conflict.strategy === 'last_write_wins') {
        nextView[key] = conflict.remote.payload as unknown as TMaterialized;
    }

    const eventLog = snapshot.eventLog.map((event) =>
        event.entity === conflict.entity && event.entityId === conflict.entityId
            ? {
                ...event,
                status: (conflict.strategy === 'manual_review' ? 'conflicted' : 'acked') as SyncStatus,
                version: conflict.remote.version,
            }
            : event
    );

    return {
        eventLog,
        materializedView: nextView,
        pendingCount: eventLog.filter((item) => item.status === 'pending' || item.status === 'syncing').length,
        failedCount: eventLog.filter((item) => item.status === 'failed').length,
        conflictCount: eventLog.filter((item) => item.status === 'conflicted').length,
    };
}

export function createEmptySyncSnapshot<TMaterialized = unknown>(): SyncSnapshot<TMaterialized> {
    return {
        eventLog: [],
        materializedView: {},
        pendingCount: 0,
        failedCount: 0,
        conflictCount: 0,
    };
}
