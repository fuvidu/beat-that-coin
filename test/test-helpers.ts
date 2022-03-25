export function getCandleStartTime(
  timeUnit: TimeUnit,
  timeframe: number
): number {
  const date = new Date();
  let startMinute = date.getMinutes();
  let startSecond = date.getSeconds();

  if (timeUnit === TimeUnit.MINUTE) {
    startMinute = getStartTimeframe(date.getMinutes(), timeframe);
    startSecond = 0;
  } else if (timeUnit === TimeUnit.SECOND) {
    startSecond = getStartTimeframe(date.getSeconds(), timeframe);
  }

  return (
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      startMinute,
      startSecond,
      0
    ).getTime() / 1000
  );
}

function getStartTimeframe(time: number, timeframe: number): number {
  const remainder: number = timeframe === 0 ? 0 : time % timeframe;
  return remainder === 0 ? time : time - remainder;
}

export function wait(delay: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export enum TimeUnit {
  SECOND = 1,
  MINUTE = 2,
}
