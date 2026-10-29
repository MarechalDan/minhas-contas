import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.marechaldan.minhascontas",
  appName: "Minhas Contas",
  webDir: "dist",
  backgroundColor: "#020617",
  android: {
    adjustMarginsForEdgeToEdge: "force",
  },
  ios: {
    contentInset: "always",
  },
  server: {
    androidScheme: "https",
    cleartext: true,
  },
};

export default config;
