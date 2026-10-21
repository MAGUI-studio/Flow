import { prisma } from "./prisma";
import { processScheduling } from "./waitlist";
const state = globalThis as unknown as {
  schedulingRun?: Promise<void>;
  schedulingLastRun?: number;
};
export async function runScheduling() {
  if (state.schedulingRun) return state.schedulingRun;
  if (Date.now() - (state.schedulingLastRun ?? 0) < 60000) return;
  state.schedulingLastRun = Date.now();
  state.schedulingRun = processScheduling(prisma()).finally(() => {
    state.schedulingRun = undefined;
  });
  return state.schedulingRun;
}
