/**
 * React entry point.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
export * from './swarm/SwarmTypes';
export * from './swarm/SwarmBus';
export * from './swarm/SwarmCoordinator';
export * from './swarm/EventStore';
export * from './swarm/RoleRegistry';
export * from './swarm/CandidateGenerator';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);