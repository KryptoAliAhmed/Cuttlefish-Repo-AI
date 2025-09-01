// /components/CuttlefishFrame.jsx
import React from 'react';
import { Sidebar } from './Sidebar';
import { DreamPanel } from './DreamPanel';
import { MessageConsole } from './MessageConsole';
import { ProposalStatus } from './ProposalStatus';

export default function CuttlefishFrame() {
  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 p-4 h-full">
          <div className="col-span-2 flex flex-col">
            <MessageConsole />
          </div>
          <div className="col-span-1 flex flex-col space-y-4">
            <DreamPanel />
            <ProposalStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
