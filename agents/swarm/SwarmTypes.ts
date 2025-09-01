export type SwarmRole = 'ProposalAgent' | 'RiskAgent' | 'GrantAgent' | string;

export interface SwarmMessage<TPayload = any> {
  id: string;
  correlationId?: string;
  replyTo?: string;
  type: string;
  from: SwarmRole;
  to?: SwarmRole | SwarmRole[];
  payload: TPayload;
  createdAt: number;
}

export interface SwarmResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type SwarmHandler = (message: SwarmMessage) => Promise<SwarmResult> | SwarmResult;

export const createMessageId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;


