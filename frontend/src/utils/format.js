export const percent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

export const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    : "Never";

export const labelName = (label = "") =>
  label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

