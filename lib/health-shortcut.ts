/** The name the Sync now button and the setup guide expect the iPhone shortcut to have. */
export const SHORTCUT_NAME = "Snapplate Sync";

/** Opens the shortcut from inside Snapplate (the Shortcuts app runs it, then returns). */
export const RUN_SHORTCUT_URL = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;
