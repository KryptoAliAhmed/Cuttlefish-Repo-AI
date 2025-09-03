import os
from typing import Dict, Any, List


def _ema(values: List[float], span: int = 10) -> float:
    if not values:
        return 0.0
    k = 2 / (span + 1)
    ema = values[0]
    for v in values[1:]:
        ema = v * k + ema * (1 - k)
    return ema


def predict_timeseries_from_ohlcv(ohlcv: List[List[float]]) -> Dict[str, Any]:
    closes = [c[4] for c in ohlcv[-100:]] if ohlcv else []
    if len(closes) < 10:
        return {"predicted_price": None, "trend_direction": "sideways", "confidence": 0.5}
    ema_short = _ema(closes[-20:], 10)
    ema_long = _ema(closes[-60:], 30)
    trend = "bullish" if ema_short > ema_long else "bearish"
    return {"predicted_price": closes[-1] * (1.02 if trend == "bullish" else 0.98), "trend_direction": trend, "confidence": 0.65}


def predict_with_llm(prompt: str) -> Dict[str, Any]:
    try:
        from openai import OpenAI  # type: ignore
        client = OpenAI()
        # Minimal deterministic prompt; expect JSON in content
        completion = client.chat.completions.create(
            model=os.getenv("PREDICT_LLM_MODEL", "gpt-4o-mini"),
            messages=[{"role": "system", "content": "Return pure JSON with keys: predicted_price, trend_direction, confidence."},
                      {"role": "user", "content": prompt}],
            temperature=0.2,
        )
        text = completion.choices[0].message.content or "{}"
        import json
        return json.loads(text)
    except Exception as e:
        return {"error": str(e)}


def get_prediction(context: Dict[str, Any], ohlcv: List[List[float]] | None = None) -> Dict[str, Any]:
    provider = os.getenv("PREDICT_PROVIDER", "mock").lower()
    if provider == "timeseries":
        if ohlcv is None:
            return {"error": "ohlcv_required"}
        return predict_timeseries_from_ohlcv(ohlcv)
    if provider == "llm":
        symbol = context.get("symbol", "BTC/USDT")
        horizon = context.get("horizon", "30d")
        return predict_with_llm(f"Predict {symbol} over {horizon}")
    # fallback
    return {"predicted_price": 1.35, "trend_direction": "bullish", "confidence": 0.72}


