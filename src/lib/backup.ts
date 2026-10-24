import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { AppData } from "../types";
import { todayISO } from "./format";

export async function exportBackup(data: AppData) {
  const fileName = `minhas-contas-backup-${todayISO()}.json`;
  const json = JSON.stringify(data, null, 2);

  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: fileName, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: "Backup Minhas Contas", text: "Backup dos meus dados do app Minhas Contas", url: uri, dialogTitle: "Salvar ou enviar backup" });
    return;
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
