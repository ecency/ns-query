import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);

export const formatMessageTime = (unixTs: number) =>
  dayjs(unixTs).format("h:mm a");

export const formatMessageDate = (unixTs: number) =>
  dayjs(unixTs).format("dddd, MMMM Do");
