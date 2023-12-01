import { format } from "date-fns";

export const formatMessageTime = (unixTs: number) =>
  format(new Date(unixTs), "h:mm a");

export const formatMessageDate = (unixTs: number) =>
  format(new Date(unixTs), "dddd, MMMM Do");
