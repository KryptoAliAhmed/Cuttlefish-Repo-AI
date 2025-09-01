# docker/docker-compose.yml

version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  builder_agents:
    build: ./builder_agents
    environment:
      - INFURA_URL_ETH=${INFURA_URL_ETH}
      - INFURA_URL_BASE=${INFURA_URL_BASE}
      - INFURA_URL_ARBITRUM=${INFURA_URL_ARBITRUM}
      - XAI_API_KEY=${XAI_API_KEY}
    depends_on:
      - redis

  dashboard:
    build: ./dashboard
    ports:
      - "8000:8000"
    depends_on:
      - redis

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  loki:
    image: grafana/loki:2.8.0
    ports:
      - "3100:3100"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=cuttlefish
    volumes:
      - ./grafana:/var/lib/grafana
    depends_on:
      - prometheus
      - loki

# prometheus.yml

scrape_configs:
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'builder_agents_logs'
    static_configs:
      - targets: ['builder_agents:8080']  # adjust if you expose metrics

# grafana/provisioning/dashboards/cuttlefish.json

{
  "dashboard": {
    "title": "Cuttlefish Labs Operations",
    "panels": [
      {"type": "graph", "title": "Redis Ops/sec", "targets":[{"expr":"rate(redis_commands_processed_total[5m])"}]},
      {"type": "table", "title": "Coordination Events", "targets":[{"expr":"onchain_events_total"}]},
      {"type": "gauge", "title": "Carbon Scores", "targets":[{"expr":"carbon_offset_score"}]}
    ]
  }
}
