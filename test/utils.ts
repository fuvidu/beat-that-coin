export function getMinuteStartTime(timeframe: number): number {
  const date = new Date();
  const remainder = timeframe === 0 ? 0 : date.getMinutes() % timeframe;
  const startMinute =
    remainder === 0 ? date.getMinutes() : date.getMinutes() - remainder;
  return (
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      startMinute,
      0,
      0
    ).getTime() / 1000
  );
}

export function getSecondStartTime(timeframe: number): number {
  const date = new Date();
  const remainder = timeframe === 0 ? 0 : date.getSeconds() % timeframe;
  const startSecond =
    remainder === 0 ? date.getSeconds() : date.getSeconds() - remainder;
  return (
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      startSecond,
      0
    ).getTime() / 1000
  );
}

export enum TimeUnit {
  SECOND = 1,
  MINUTE = 2,
}
