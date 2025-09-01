import { SwarmHandler, SwarmMessage, SwarmRole } from './SwarmTypes';
import { EventStore } from './EventStore';

export class SwarmBus {
  private handlers: Map<SwarmRole, SwarmHandler[]> = new Map();
  private store: EventStore;
  private maxRetries = 3;
  private deadLetter: any[] = [];

  constructor(store: EventStore = new EventStore()) {
    this.store = store;
  }

  subscribe(role: SwarmRole, handler: SwarmHandler) {
    const existing = this.handlers.get(role) || [];
    this.handlers.set(role, [...existing, handler]);
    return () => this.unsubscribe(role, handler);
  }

  unsubscribe(role: SwarmRole, handler: SwarmHandler) {
    const existing = this.handlers.get(role) || [];
    this.handlers.set(role, existing.filter(h => h !== handler));
  }

  async publish(message: SwarmMessage): Promise<void> {
    this.store.append({ kind: 'publish', message });
    const targets = Array.isArray(message.to) ? message.to : [message.to].filter(Boolean);
    const targetRoles = targets.length > 0 ? targets : Array.from(this.handlers.keys());
    await Promise.all(
      targetRoles
        .filter((role): role is string => typeof role === 'string')
        .map(async role => {
          const list = this.handlers.get(role) || [];
          for (const handler of list) {
            try {
              const res = await this.deliverWithRetry(handler, message);
              this.store.append({ kind: 'delivery', role, message, result: res });
          } catch (err) {
            // Non-fatal: continue delivering to other handlers
            this.store.append({ kind: 'error', role, message, error: (err as Error)?.message });
          }
        }
      })
    );
  }

  private async deliverWithRetry(handler: SwarmHandler, message: SwarmMessage) {
    let attempt = 0;
    let lastErr: any = null;
    while (attempt < this.maxRetries) {
      try {
        return await handler(message);
      } catch (err) {
        lastErr = err;
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)));
        attempt += 1;
      }
    }
    this.deadLetter.push({ message, error: (lastErr as Error)?.message, failedAt: Date.now() });
    throw lastErr || new Error('Delivery failed');
  }
}


