import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

const PROMPT_STORAGE_KEY = "appUpdatePrompt";
const PROMPT_INTERVAL_MS = 24 * 60 * 60 * 1000;

type PromptRecord = {
  storeVersion: string;
  promptedAt: number;
};

type InAppUpdatesModule = typeof import("expo-in-app-updates");

function canUseInAppUpdates(): boolean {
  if (__DEV__ || Platform.OS === "web") return false;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  return true;
}

function loadInAppUpdates(): InAppUpdatesModule | null {
  if (!canUseInAppUpdates()) return null;

  try {
    // Lazy load so Expo Go / dev clients without the native module still start.
    return require("expo-in-app-updates") as InAppUpdatesModule;
  } catch {
    return null;
  }
}

/** Back off for a day per store version so the reminder never nags. */
async function shouldPrompt(storeVersion: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PROMPT_STORAGE_KEY);
    if (!raw) return true;

    const record = JSON.parse(raw) as PromptRecord;
    if (record.storeVersion !== storeVersion) return true;

    return Date.now() - record.promptedAt >= PROMPT_INTERVAL_MS;
  } catch {
    return true;
  }
}

async function rememberPrompt(storeVersion: string): Promise<void> {
  const record: PromptRecord = { storeVersion, promptedAt: Date.now() };
  try {
    await AsyncStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // A failed write only means the user may be reminded again sooner.
  }
}

/**
 * Compares the installed build against the Play Store / App Store listing and
 * reports when a newer version is published.
 */
export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const isChecking = useRef(false);

  const check = useCallback(async () => {
    const InAppUpdates = loadInAppUpdates();
    if (!InAppUpdates || isChecking.current) return;

    isChecking.current = true;

    try {
      const result = await InAppUpdates.checkForUpdate();
      if (!result.updateAvailable) return;
      if (!(await shouldPrompt(result.storeVersion))) return;

      await rememberPrompt(result.storeVersion);
      setUpdateAvailable(true);
    } catch (error) {
      console.log("App update check failed:", error);
    } finally {
      isChecking.current = false;
    }
  }, []);

  useEffect(() => {
    if (!canUseInAppUpdates()) return;

    check();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });

    return () => subscription.remove();
  }, [check]);

  const dismiss = useCallback(() => setUpdateAvailable(false), []);

  const startUpdate = useCallback(async () => {
    const InAppUpdates = loadInAppUpdates();
    if (!InAppUpdates) return;

    setUpdateAvailable(false);
    try {
      // Android runs Google's native update flow, iOS opens the App Store.
      await InAppUpdates.startUpdate();
    } catch (error) {
      console.log("Failed to start app update:", error);
    }
  }, []);

  return { updateAvailable, dismiss, startUpdate };
}
