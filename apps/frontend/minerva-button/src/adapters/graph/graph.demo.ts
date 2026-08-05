import { DEMO_LATENCY_MS } from '@/constants/request.constants';
import { createDemoMime } from '@/fixtures/demo/mime.fixture';
import type { GraphAdapter, NotificationMail, WellKnownFolder } from './graph.types';

/** Resolves after {@link DEMO_LATENCY_MS}, so the loading screens are legible. */
function pause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY_MS));
}

/**
 * A {@link GraphAdapter} that answers from fixtures and never touches the network.
 *
 * This one matters more than its Minerva counterpart. The other two calls it
 * stands in for have side effects in a real mailbox -- `sendMail` puts mail in
 * front of a security team, `moveMessage` moves a message a user still has open
 * -- so demo mode is not merely a convenience here, it is what keeps a
 * walkthrough from filing real reports. Both are recorded and dropped.
 *
 * The record is exposed so a demo walkthrough, or a test, can assert on what
 * *would* have been sent.
 *
 * @returns The fixture implementation of the Graph adapter, plus what it recorded.
 *
 * @see {@link ./graph.http.ts} -- the real one
 *
 * @example
 * ```ts
 * const { adapter, sentMail } = createGraphDemoAdapter();
 * await adapter.sendMail(mail);
 * expect(sentMail).toHaveLength(1);
 * ```
 */
export function createGraphDemoAdapter(): {
  adapter: GraphAdapter;
  sentMail: NotificationMail[];
  movedMessages: { exchangeId: string; destination: WellKnownFolder }[];
} {
  const sentMail: NotificationMail[] = [];
  const movedMessages: { exchangeId: string; destination: WellKnownFolder }[] = [];

  const adapter: GraphAdapter = {
    async getMimeMessage(): Promise<Blob> {
      await pause();

      return createDemoMime();
    },

    async sendMail(mail: NotificationMail): Promise<void> {
      await pause();
      sentMail.push(mail);
    },

    async moveMessage(exchangeId: string, destination: WellKnownFolder): Promise<void> {
      await pause();
      movedMessages.push({ exchangeId, destination });
    },
  };

  return { adapter, sentMail, movedMessages };
}
