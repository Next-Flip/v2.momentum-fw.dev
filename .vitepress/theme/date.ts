const ensureDate = (dateInput: Date | number | string) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === "number") return new Date(dateInput * 1000);
    return new Date(dateInput);
};

export const formatDate = (
    dateInput: Date | string | number,
    type: "short" | "fullYear" | "withTime" | "timeOnly",
): string => {
    const date = ensureDate(dateInput);
    if (!date) return "";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date
        .getFullYear()
        .toString()
        .slice(type === "short" ? -2 : 0);
    const dateStr = `${day}.${month}.${year}`;
    if (type === "short" || type === "fullYear") return dateStr;

    const timeStr = date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    if (type === "timeOnly") return timeStr;

    return `${dateStr}, ${timeStr}`;
};
