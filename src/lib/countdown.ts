export type CountdownParts = {
  isComplete: boolean;
  totalMilliseconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getCountdownParts(
  target: Date | string | number,
  now: Date | string | number = new Date()
): CountdownParts {
  const targetTime = new Date(target).getTime();
  const nowTime = new Date(now).getTime();

  if (!Number.isFinite(targetTime) || !Number.isFinite(nowTime)) {
    throw new Error("Invalid countdown date.");
  }

  const totalMilliseconds = Math.max(targetTime - nowTime, 0);
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isComplete: totalMilliseconds === 0,
    totalMilliseconds,
    days,
    hours,
    minutes,
    seconds
  };
}

export function formatCountdownNumber(value: number): string {
  return value.toString().padStart(2, "0");
}
