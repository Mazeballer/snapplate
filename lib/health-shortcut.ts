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

Rules: do not use any Apple Intelligence or Use Model action. Do not ask me questions or show notifications. Do not change the URL, the header name or the field names. Use the plain Health actions listed above.

Then create an automation that runs "${SHORTCUT_NAME}" every time I open the app Snapplate. Set it to Run Immediately so it does not ask first. If Snapplate cannot be chosen as an app, instead create four Time of Day automations, daily at 8:00 AM, 1:00 PM, 6:00 PM and 10:00 PM, each running "${SHORTCUT_NAME}" immediately without asking.`;
}

/** A follow-up to send if the first build is not quite right (the builder takes conversational fixes). */
export const FIX_UP_PROMPT = `Check the "${SHORTCUT_NAME}" shortcut and fix anything that does not match this:
- It has two Find Health Samples actions: one with Type Steps, one with Type Active Energy, both with Start Date is Today.
- Each is followed by Calculate Statistics with the statistic Sum.
- Get Contents of URL uses Method POST and a JSON request body.
- The JSON body has only two fields, and both are type Number: steps (the Sum of the steps) and activeKcal (the Sum of the active energy). They must not be Text.
- There is one header named exactly Authorization. Its value starts with Bearer and a space.
- There are no Use Model or Apple Intelligence actions.
Fix anything that differs and tell me what you changed.`;

/** An optional follow-up that adds the named workouts to the same shortcut. */
export const WORKOUTS_PROMPT = `Add today's workouts to the "${SHORTCUT_NAME}" shortcut, before the Get Contents of URL step:
1. Find Health Samples. Type is Workouts. Start Date is Today.
2. Repeat with Each workout. For each one, make a Dictionary with these four Text items: name is the workout type, startedAt is the workout start date formatted as ISO 8601, durationMin is the workout duration, calories is the workout active energy. Add each Dictionary to a list variable named Workouts.
3. In the JSON request body of Get Contents of URL, add one more field named workouts of type List, with the value Workouts.
Keep everything else in the shortcut exactly as it is.`;
