<div align="center">

<h1>🔐 Secure Real-Time Chat</h1>
<p><em>A full-stack, security-first communication platform with end-to-end encryption, JWT authentication, and an administrative oversight dashboard.</em></p>

<p>
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License"/>
</p>

<p>
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Stack</a> •
  <a href="#-security-architecture">Security</a> •
  <a href="#-getting-started">Setup</a> •
  <a href="#-project-structure">Structure</a>
</p>

</div>

---

## Overview

A high-performance, secure messaging platform designed with a **security-first architecture**. Built as part of a Secure Software Design and Engineering course, this project demonstrates real-world application of cryptographic principles, role-based access control, and secure API design in a full-stack environment.

The system provides real-time communication via WebSockets, encrypted data storage using Fernet symmetric encryption, and a dedicated admin dashboard for system monitoring — making it a practical reference for **AppSec** concepts applied in production-grade software.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Real-Time Messaging** | Bidirectional communication via WebSocket integration |
| **Cryptographic Security** | Fernet symmetric encryption for data at rest; message integrity validation |
| **JWT Authentication** | Stateless session management with role-based access control (RBAC) |
| **Admin Dashboard** | Room management, user oversight, and system log monitoring |
| **Threat Modeling** | Formal security documentation covering attack surfaces and risk management |
| **Responsive UI** | Mobile-ready interface built with Next.js 15 and Tailwind CSS |

---

## 🛠 Tech Stack

**Backend**
- **Framework:** Python + FastAPI (async-first REST + WebSocket API)
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Security Layer:** Fernet symmetric encryption, JWT (PyJWT), Pydantic schema validation

**Frontend**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** Radix UI / shadcn/ui (dialogs, avatars, tooltips)

---

## 🛡 Security Architecture

This system is designed around the principle of **defense in depth**:

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Next.js)                  │
│           JWT stored securely · HTTPS/WSS           │
└──────────────────────┬──────────────────────────────┘
                       │ TLS in transit
┌──────────────────────▼──────────────────────────────┐
│                  API LAYER (FastAPI)                 │
│   JWT Auth Middleware · Pydantic Validation · RBAC  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              DATA LAYER (PostgreSQL)                 │
│       Fernet-encrypted sensitive fields at rest      │
└─────────────────────────────────────────────────────┘
```

1. **Data at Rest** — Sensitive fields are encrypted with Fernet before database insertion.
2. **Data in Transit** — All traffic is intended to be served over TLS; WebSockets operate over `wss://`.
3. **Authentication** — JWT tokens with expiry enforce stateless, role-aware access.
4. **Input Validation** — Pydantic schemas sanitize and validate all incoming request data.
5. **Threat Modeling** — Project documentation includes a formal threat model with identified attack vectors and mitigations.

---

## 📂 Project Structure

```
secure-chat/
├── Backend/
│   ├── HelperFunction/         # Cryptography, JWT utilities, validation logic
│   ├── PostgresSql/            # SQLAlchemy models and DB connection
│   ├── route/
│   │   ├── auth.py             # Registration, login, token endpoints
│   │   ├── admin.py            # Admin-only management endpoints
│   │   └── chats.py            # WebSocket + messaging endpoints
│   └── main.py                 # FastAPI application entry point
│
├── Frontend/
│   └── real_chat_app/
│       ├── app/                # Next.js App Router pages and layouts
│       ├── components/         # StatsCards, DataTables, Sidebar, Modals
│       └── lib/                # API client utilities and type definitions
│
└── Documentation/
    ├── Proposal.pdf         # System design and data flow diagrams
    └── Security Requirements, Planning, and RiskManagement.pdf        # Threat model and security requirements
    └── System_Architecture_Diagram.png
```

---

## 🚀 Getting Started

### Prerequisites

- Python `3.9+`
- Node.js `18+`
- A running PostgreSQL instance

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd Backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create and populate your .env file
cp .env.example .env
# → Set DATABASE_URL, SECRET_KEY, FERNET_KEY

# 4. Start the FastAPI server
python main.py
```

The API will be available at `http://localhost:8000`. Interactive docs at `/docs`.

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd Frontend/real_chat_app

# 2. Install packages
npm install

# 3. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 📸 Screenshots

> _Admin Dashboard — room management, user monitoring, and system logs_
<img width="953" height="415" alt="image" src="https://github.com/user-attachments/assets/bcabbda4-458b-45c7-bd92-6aa8e294ec7a" />
<img width="1904" height="831" alt="image" src="https://github.com/user-attachments/assets/6d053a40-7ce7-44d1-afba-4fdf38a07cff" />
<img width="1418" height="646" alt="image" src="https://github.com/user-attachments/assets/02f2c5ab-5302-4f79-aa75-204e1869bbaf" />

---

## 🔮 Roadmap

- [ ] End-to-end encryption (client-side key exchange)
- [ ] brute-force protection middleware
- [ ] Automated security testing with static and dynamic tools 

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 📧 Contact

**Hassan** — Cybersecurity Student @ GIKI, Pakistan
Focused on **ML Security** and **Application Security**

> _Open to Summer/Fall 2025 internship opportunities in ML Security and Application Security._
