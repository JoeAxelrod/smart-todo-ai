
Smart Todo List with AI Tagging
===============================

This project is a fullstack web application allowing users to manage a todo list, which automatically categorizes tasks using an LLM (Large Language Model) based on content.

🛠️ Tech Stack
--------------

*   **Frontend:** React, Vite, TypeScript, MUI
*   **Backend:** Node.js, Express, PostgreSQL, Kafka, Ollama (gemma:2b)

🚀 Features
-----------

*   Add and manage todo tasks.
*   Automatic task categorization with AI-generated tags.
*   Real-time tag updates via WebSockets.
*   User authentication and session management.

⚙️ Setup Instructions
---------------------

1.  **Clone the Repository:**
    
        git clone https://github.com/JoeAxelrod/smart-todo-ai.git
        cd smart-todo-ai
    
2.  **Start Essential Docker Services:**
    
        docker compose up -d postgres zookeeper kafka ollama
    
3.  **Pull the Ollama AI Model (Gemma):**
    
        docker compose exec ollama ollama pull gemma:2b
    
4.  **Start Adminer (optional, DB management):**
    
        docker compose up -d adminer
    
    Access via: [http://localhost:8080](http://localhost:8080)
5.  **Set up Frontend:**
    
        cd client
        npm install
        npm run dev
    
    Frontend will run at: [http://localhost:5173](http://localhost:5173)
6.  **Set up Backend:**
    
        cd server
        npm install
        npm run dev
    
    Backend API available at: [http://localhost:4000](http://localhost:4000)

🔑 Example Login
----------------

    name: Any username (creates token automatically)
    You can sign out and sign in with another account, then return to the first account.

📺 Project Demo
---------------

[![Project Demo](https://www.youtube.com/watch?v=WSl_B8qAZyM)


🎯 Bonus Tasks Implemented
--------------------------

*   User authentication with token-based session.
*   Real-time updates using Socket.io.
*   Task deletion functionality.
*   Installing a mini real LLM model as part of the project via Docker
*   Queued tasks to be sent to the model using **Kafka**

📂 Project Structure
--------------------

```text
smart-todo-ai/
├── client/               # React frontend
├── server/               # Express backend
└── docker-compose.yml    # Docker Compose configuration
```