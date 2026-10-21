import { bookingReminders } from "@/lib/notifications";
import { completeOverdueBookings } from "./booking-completion";
import { prisma } from "./prisma";

const state = globalThis as unknown as {
  flowCompletionTimer?: ReturnType<typeof setInterval>;
  flowCompletionRunning?: boolean;
};

export function startBookingCompletionWorker() {
  if (state.flowCompletionTimer || !process.env.DATABASE_URL) return;
  async function run() {
    if (state.flowCompletionRunning) return;
    state.flowCompletionRunning = true;
    try {
      await bookingReminders(prisma());
      // Bounded batches also catch up after downtime without holding a long transaction.
      for (let batch = 0; batch < 10; batch++) {
        if ((await completeOverdueBookings(prisma())) < 500) break;
      }
    } catch {
      console.error(
        "Não foi possível concluir os agendamentos vencidos. Nova tentativa em um minuto.",
      );
    } finally {
      state.flowCompletionRunning = false;
    }
  }
  state.flowCompletionTimer = setInterval(() => void run(), 60_000);
  state.flowCompletionTimer.unref();
  void run();
}
