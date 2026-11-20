/** The name the Sync now button and the setup guide expect the iPhone shortcut to have. */
export const SHORTCUT_NAME = "Snapplate Sync";

/** Opens the shortcut from inside Snapplate (the Shortcuts app runs it, then returns). */
export const RUN_SHORTCUT_URL = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;

/** Stands in for the person's key in prompts. The real key is never put into a prompt. */
export const KEY_PLACEHOLDER = "PASTE_MY_KEY_HERE";

/**
 * The message to give iOS 27's Shortcuts (Apple Intelligence) so it builds the sync shortcut.
 * It is written to leave nothing to interpret: the order, the action names, the exact field
 * names and types, and what must not be added.
 */
export function buildShortcutPrompt(endpoint: string): string {
  return `Create a shortcut named "${SHORTCUT_NAME}" with exactly these steps, in this order:

1. Find Health Samples. Type is Steps. Start Date is Today.
2. Calculate Statistics on those samples. Statistic is Sum. Name the result StepsTotal.
3. Find Health Samples. Type is Active Energy. Start Date is Today.
4. Calculate Statistics on those samples. Statistic is Sum. Name the result ActiveEnergyTotal.
5. Get Contents of URL. URL is ${endpoint}
   Method is POST.
   Headers: one header. The name is Authorization and the value is Bearer ${KEY_PLACEHOLDER}
   (I will replace ${KEY_PLACEHOLDER} with my real key myself, so keep it exactly like that, with one space after Bearer.)
   Request Body is JSON with exactly two fields:
   - steps, type Number, value StepsTotal
   - activeKcal, type Number, value ActiveEnergyTotal
6. Show Result of the Get Contents of URL step.

Rules: do not use any Apple Intelligence or Use Model action. Do not ask me questions or show notifications. Do not change the URL, the header name or the field names. Use the plain Health actions listed above.`;
}
