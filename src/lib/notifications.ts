import { useEffect } from "react";
import { useStore } from "./store";
import { occurrencesIn } from "./ledger";
import { todayISO, monthKey } from "./format";
import type { Occurrence } from "../types";

export function useNotifications() {
  const { data } = useStore();

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const checkNotifications = () => {
      const today = todayISO();
      const reminderDays = data.settings.reminderDays ?? 3;

      // Calcular data do lembrete
      const [y, m, d] = today.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() + reminderDays);
      const reminderDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      const currentMonth = monthKey();
      const occurrences = occurrencesIn(data.transactions, currentMonth);

      const upcoming = occurrences.filter((o: Occurrence) => {
        if (o.tx.type !== "expense" || o.paid) return false;
        return o.date === reminderDate;
      });

      if (upcoming.length > 0) {
        const titles = upcoming.map((o: Occurrence) => o.tx.description).slice(0, 3);
        const message = upcoming.length > 3
          ? `${titles.join(", ")} e mais ${upcoming.length - 3} contas`
          : titles.join(", ");

        new Notification("Contas a vencer em breve", {
          body: message,
          icon: "/icon-192.png",
        });
      }
    };

    // Verificar a cada hora
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);
    checkNotifications(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, [data, data.settings.reminderDays]);
}
