import os
import time
from typing import Dict, Any, List, Optional, Tuple


def _compute_simple_signal(ohlcv: List[List[float]]) -> Dict[str, Any]:
    # ohlcv: [ [ts, open, high, low, close, volume], ... ]
    closes = [c[4] for c in ohlcv[-50:]] if ohlcv else []
    if len(closes) < 10:
        return {"signal": "HOLD", "confidence": 0.5}
    short = sum(closes[-5:]) / 5
    long = sum(closes[-20:]) / 20
    if short > long * 1.002:
        return {"signal": "BUY", "confidence": 0.7}
    if short < long * 0.998:
        return {"signal": "SELL", "confidence": 0.7}
    return {"signal": "HOLD", "confidence": 0.55}


def fetch_signal_from_ccxt(symbol: str = "BTC/USDT", exchange_id: str = "binance", timeframe: str = "1h", limit: int = 100) -> Dict[str, Any]:
    try:
        import ccxt  # type: ignore
    except Exception:
        return {"signal": "HOLD", "confidence": 0.5, "note": "ccxt not installed"}

    try:
        exchange_cls = getattr(ccxt, exchange_id)
        exchange = exchange_cls({"enableRateLimit": True})
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
        sig = _compute_simple_signal(ohlcv)
        return {"source": "ccxt", "symbol": symbol, **sig}
    except Exception as e:
        return {"signal": "HOLD", "confidence": 0.5, "error": str(e)}


def fetch_signal_from_uniswap_subgraph(pool_address: str, days: int = 1) -> Dict[str, Any]:
    import requests  # type: ignore
    url = os.getenv("UNISWAP_SUBGRAPH_URL", "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3")
    query = {
        "query": """
        query($pool: ID!, $days: Int!) {
          pool(id: $pool) {
            id
            volumeUSD
            feesUSD
            liquidity
          }
        }
        """,
        "variables": {"pool": pool_address.lower(), "days": days},
    }
    try:
        r = requests.post(url, json=query, timeout=10)
        data = r.json()
        pool = data.get("data", {}).get("pool") or {}
        # naive LP preference signal based on feesUSD
        fees = float(pool.get("feesUSD") or 0)
        if fees > 10000:
            return {"source": "subgraph", "signal": "LP_ADD", "confidence": 0.65}
        return {"source": "subgraph", "signal": "HOLD", "confidence": 0.55}
    except Exception as e:
        return {"signal": "HOLD", "confidence": 0.5, "error": str(e)}


def get_market_signal(context: Dict[str, Any]) -> Dict[str, Any]:
    provider = os.getenv("MARKET_PROVIDER", "mock").lower()
    if provider == "ccxt":
        symbol = context.get("symbol", "BTC/USDT")
        return fetch_signal_from_ccxt(symbol)
    if provider == "subgraph":
        pool = context.get("pool_address", "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8")
        return fetch_signal_from_uniswap_subgraph(pool)
    # fallback mock
    return {"source": "mock", "signal": "BUY", "confidence": 0.78}


