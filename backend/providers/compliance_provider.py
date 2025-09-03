import os
import json
from typing import Dict, Any


def _eval_rules(context: Dict[str, Any], rules: Dict[str, Any]) -> Dict[str, Any]:
    score = 1.0
    approvals = {
        'environmental_approved': True,
        'zoning_approved': True,
        'safety_approved': True,
    }
    # Simple rule evaluation
    budget = float(context.get('budget', 0))
    max_budget = float(rules.get('max_budget', 0))
    if max_budget and budget > max_budget:
        approvals['zoning_approved'] = False
        score -= 0.2
    jurisdictions = rules.get('allowed_jurisdictions')
    if jurisdictions:
        j = str(context.get('jurisdiction', '')).lower()
        if j and j not in [x.lower() for x in jurisdictions]:
            approvals['environmental_approved'] = False
            score -= 0.3
    min_safety = float(rules.get('min_safety_score', 0.0))
    safety = float(context.get('safety_score', 1.0))
    if safety < min_safety:
        approvals['safety_approved'] = False
        score -= 0.3
    score = max(score, 0.0)
    return {**approvals, 'overall_compliance': score}


def compliance_from_rules(context: Dict[str, Any]) -> Dict[str, Any]:
    path = os.getenv('COMPLIANCE_RULES_PATH')
    if not path or not os.path.exists(path):
        return {'error': 'rules_not_found'}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            rules = json.load(f)
        return _eval_rules(context, rules)
    except Exception as e:
        return {'error': str(e)}


def compliance_from_service(context: Dict[str, Any]) -> Dict[str, Any]:
    import requests  # type: ignore
    url = os.getenv('COMPLIANCE_SERVICE_URL')
    if not url:
        return {'error': 'service_url_missing'}
    try:
        r = requests.post(url, json=context, timeout=15)
        return r.json()
    except Exception as e:
        return {'error': str(e)}


def get_compliance(context: Dict[str, Any]) -> Dict[str, Any]:
    provider = os.getenv('COMPLIANCE_PROVIDER', 'rules').lower()
    if provider == 'service':
        return compliance_from_service(context)
    if provider == 'rules':
        return compliance_from_rules(context)
    return {'error': 'unknown_provider'}


