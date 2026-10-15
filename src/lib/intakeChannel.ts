/**
 * Tells other tabs that an intake form was finished, so a dashboard open in another tab can drop
 * it from "Outstanding forms" without the patient reloading. Same-origin only; nothing sensitive
 * is sent — just which submission finished.
 */
const NAME = "apex-intake";

export function announceIntakeCompleted(submissionId: string): void {
  try {
    const channel = new BroadcastChannel(NAME);
    channel.postMessage({ type: "intake-completed", submissionId });
    channel.close();
  } catch {
    /* Older browsers: the dashboard catches up on its next load. */
  }
}

export function onIntakeCompleted(handler: (submissionId: string) => void): () => void {
  try {
    const channel = new BroadcastChannel(NAME);
    channel.onmessage = (e) => {
      if (e.data?.type === "intake-completed") handler(String(e.data.submissionId ?? ""));
    };
    return () => channel.close();
  } catch {
    return () => {};
  }
}
