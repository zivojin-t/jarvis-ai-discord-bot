# Jarvis AI – Event-Driven Discord Assistant

![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green?logo=node.js)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue?logo=discord)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-orange?logo=openai)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

A production-ready, containerized Discord bot leveraging the OpenAI Chat Completions API. Built with event-driven architecture, contextual history awareness, automated message chunking, and isolated environment management.

---

## Key Features

- **Direct Mention Filter & Event Control:** Listens for direct user mentions (`@Jarvis`) to prevent channel spamming and unintended API invocation loops.
- **Context-Aware Memory Pipeline:** Dynamically fetches and parses the last 40 channel messages, formatting them into structured roles (`system`, `user`, `assistant`) for natural multi-turn conversations.
- **Dynamic Model Selection:** Configured via environment variables (defaults to `gpt-4o` for optimized latency and reasoning performance).
- **Buffer & Split Engine:** Automatically splits model responses exceeding Discord's strict 2,000-character limit into sequential chunks to prevent API exceptions.
- **Containerized Deployment:** Dockerized using a lightweight Alpine Linux base image for cross-platform portability and zero-drift deployments.

---

## Architecture Overview

```text
User Mentions Bot (@Jarvis)
           │
           ▼
[Discord Gateway Event] ───► Filter (Ignore Bots / Prefix / Non-Mentions)
                                      │
                                      ▼
                      Fetch & Sanitize Channel History
                                      │
                                      ▼
                      [OpenAI API (GPT-4o Completion)]
                                      │
                                      ▼
                      Response Chunking (<= 1990 chars)
                                      │
                                      ▼
                       Dispatch Reply via Discord Channel