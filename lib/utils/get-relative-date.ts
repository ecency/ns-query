import dayjs from "dayjs";

export function getRelativeDate(timestamp?: number) {
  if (!timestamp) {
    return "";
  }

  const date = dayjs.unix(timestamp);
  const now = dayjs();

  if (now.day() === date.day() && now.diff(date, "hour") <= 24) {
    return date.format("HH:mm");
  } else if (now.diff(date, "day") <= 7) {
    return date.format("ddd");
  } else if (now.diff(date, "year") === 0) {
    return date.format("DD.MM");
  } else {
    return date.format("DD.MM.YYYY");
  }
}
