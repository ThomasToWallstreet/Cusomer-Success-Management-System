const CST_TIME_ZONE = "Asia/Shanghai";

type DateInput = Date | string | number;

function toDate(value: DateInput) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

function formatWithTimeZone(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
) {
  const date = toDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: CST_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatDateCST(value: DateInput) {
  return formatWithTimeZone(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replaceAll("/", "-");
}

export function formatDateTimeCST(value: DateInput) {
  const dateText = formatDateCST(value);
  if (dateText === "-") return "-";
  const timeText = formatWithTimeZone(value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (timeText === "-") return "-";
  return `${dateText} ${timeText}`;
}
