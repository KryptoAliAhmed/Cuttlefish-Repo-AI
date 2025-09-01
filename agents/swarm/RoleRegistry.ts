export class RoleRegistry {
  private roleToIds: Map<string, string[]> = new Map();

  register(role: string, agentId: string) {
    const list = this.roleToIds.get(role) || [];
    if (!list.includes(agentId)) this.roleToIds.set(role, [...list, agentId]);
  }

  getAgents(role: string): string[] {
    return this.roleToIds.get(role) || [];
  }
}

export type RoutingPolicy = 'broadcast' | 'round_robin' | { quorum: number };

export function selectTargets(roleIds: string[], policy: RoutingPolicy): string[] {
  if (policy === 'broadcast') return roleIds;
  if (policy === 'round_robin') return roleIds.length ? [roleIds[0]] : [];
  if (typeof policy === 'object' && 'quorum' in policy) return roleIds.slice(0, policy.quorum);
  return roleIds;
}


