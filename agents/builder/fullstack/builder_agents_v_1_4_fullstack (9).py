# ansible/site.yml

---
- hosts: all
  become: true
  tasks:
    - name: Update packages
      apt:
        update_cache: yes

    - name: Install base deps
      apt:
        name:
          - docker.io
          - docker-compose
          - git
          - python3-pip
        state: present

    - name: Install Python ecosystem
      pip:
        name:
          - web3
          - aiohttp
          - xai-sdk
          - python-dotenv
          - fastapi
          - uvicorn
          - pydantic
          - bip39
          - eth-account
          - brownie
          - aioredis

    - name: Clone Cuttlefish Labs repo
      git:
        repo: https://github.com/your-repo/cuttlefish-labs.git
        dest: /app

    - name: Start Docker Compose
      command: docker-compose up -d
      args:
        chdir: /app/docker

- hosts: all
  tasks:
    - name: Setup monitoring stack (Grafana, Prometheus, Loki)
      git:
        repo: https://github.com/your-monitoring-repo/cuttlefish-monitoring.git
        dest: /monitoring

    - name: Start monitoring stack
      command: docker-compose up -d
      args:
        chdir: /monitoring
