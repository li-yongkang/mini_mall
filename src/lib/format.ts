/** 分 → "¥xx.xx"。纯整数运算，杜绝浮点误差 */
export function formatPrice(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}¥${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Date → "YYYY-MM-DD HH:mm" */
export function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
