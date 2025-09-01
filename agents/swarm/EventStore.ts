let fsRef: any = null;
try {
  if (typeof window === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fsRef = require('fs');
  }
} catch {
  // Ignore require errors
}

export class EventStore {
  private path: string;

  constructor(path: string = 'json-logs/swarm_events.jsonl') {
    this.path = path;
  }

  append(event: unknown) {
    if (!fsRef) return; // no-op in browser
    try {
      const line = JSON.stringify(event) + '\n';
      fsRef.appendFileSync(this.path, line);
    } catch (_) {
      // swallow logging errors
    }
  }
}


