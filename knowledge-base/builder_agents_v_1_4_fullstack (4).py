# ✅ FastAPI Dashboard with /ws_events for streaming Solidity CoordinationContract events

from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
import uvicorn
import asyncio

app = FastAPI()

class EventStreamer:
    def __init__(self, w3, coord_contract):
        self.w3 = w3
        self.coord_contract = coord_contract
        self.last_block = self.w3.eth.block_number

    async def poll_events(self):
        new_block = self.w3.eth.block_number
        events = []
        if new_block > self.last_block:
            for event_name in ["AlphaIdentified", "TradeExecuted", "LPPositionUpdated", "GovernanceProposalNeeded"]:
                filt = getattr(self.coord_contract.events, event_name).create_filter(fromBlock=self.last_block+1, toBlock=new_block)
                entries = filt.get_all_entries()
                for log in entries:
                    events.append({"event": log.event, "args": dict(log.args), "block": log.blockNumber})
            self.last_block = new_block
        return events

streamer = None  # will initialize in main()

@app.websocket("/ws_events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        events = await streamer.poll_events()
        for event in events:
            await websocket.send_json(event)
        await asyncio.sleep(2)

@app.get("/events")
async def get_recent_events():
    events = await streamer.poll_events()
    return JSONResponse(content=events)

if __name__ == "__main__":
    # Assuming w3_eth + CoordinationContract instantiated globally as `coord_contract`
    streamer = EventStreamer(w3_eth, coord_contract.contract)
    uvicorn.run(app, host="0.0.0.0", port=8000)
