export function calculateNextTarget(
  lastWeight: number,
  repsCompleted: number,
  targetReps: number
): number {
  if (repsCompleted >= targetReps) {
    return lastWeight + 5;
  }

  return lastWeight;
}
