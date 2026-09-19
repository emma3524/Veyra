✨ Features
🔐 User authentication
💰 Income tracking
💸 Expense tracking
🧾 Transaction management
🏷️ Transaction categories
📊 Spending analytics
💵 Balance overview
🎯 Savings goals
📅 Budget tracking
🔎 Transaction search and filtering
📱 Responsive design
🌙 Dark/light interface
🔒 User-specific cloud data
⚡ Real-time data powered by Firebase
Planned Features
🏦 Bank account integration through an appropriate Open Banking provider
🔄 Automatic transaction synchronization
🤖 Intelligent spending insights
📈 Advanced financial reports
🔔 Budget and spending notifications
📚 Personal finance learning resources
🎯 Problem

Managing personal finances can become difficult when transactions are scattered across bank apps, notes, messages, and memory.

Many people know how much money they receive but have little visibility into where that money actually goes.

Veyra provides a single interface where users can record and understand their financial activity.

Instead of simply displaying numbers, Veyra turns transactions into useful information through summaries, categories, budgets, and visual analytics.

💡 Solution

Veyra allows users to:

Record their income and expenses.
Organize transactions into categories.
Monitor their current financial balance.
Understand their spending patterns.
Set budgets and savings goals.
Review their financial activity through visual analytics.

The long-term goal is to make financial tracking less tedious and more understandable for everyday users.

🌍 Community Impact

Veyra is designed to encourage financial awareness, particularly among students and young adults.

By making spending patterns visible, the application can help users:

Understand their spending habits.
Identify areas where they spend the most.
Plan monthly budgets.
Track progress toward savings goals.
Become more intentional about everyday financial decisions.

Veyra is not intended to provide financial advice or guarantee financial outcomes. Its purpose is to give users clearer information about their own financial activity.

🛠️ Tech Stack
Frontend
React
JavaScript
Vite
React Router
Tailwind CSS
Backend & Cloud
Firebase Authentication
Cloud Firestore
Firebase Security Rules
Data Visualization
Recharts
UI
Lucide React
Responsive design
Modern component-based architecture
Development
Git
GitHub
🏗️ Application Architecture
                    Veyra
                      │
                      ▼
              React Frontend
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
 Firebase Authentication     Firestore
          │                       │
          │                 Transactions
          │                 Budgets
          │                 Goals
          │                       │
          └───────────┬───────────┘
                      ▼
               Veyra Dashboard
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      Analytics   Transactions  Financial
                                Overview
🔐 Security

Veyra uses Firebase Authentication to identify users and Firebase Security Rules to control access to user-specific data.

A user's financial information should only be accessible to the authenticated user it belongs to.

Security will be treated as a core part of the application architecture rather than something added at the end of development.

📂 Project Structure
src/
│
├── assets/
│
├── components/
│   ├── Navbar/
│   ├── Sidebar/
│   ├── StatCard/
│   ├── Transaction/
│   ├── Charts/
│   └── Forms/
│
├── pages/
│   ├── Dashboard/
│   ├── Transactions/
│   ├── Budgets/
│   ├── Goals/
│   └── Settings/
│
├── services/
│   └── firebase.js
│
├── hooks/
│
├── utils/
│
├── App.jsx
├── main.jsx
└── index.css
⚙️ Getting Started
1. Clone the repository
git clone https://github.com/YOUR-USERNAME/veyra.git
2. Navigate into the project
cd veyra
3. Install dependencies
npm install
4. Configure Firebase
Example:
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

Never commit private credentials or sensitive configuration to the repository.

5. Start the development server
npm run dev
The application will be available through the local development URL provided by Vite.

Create a Firebase project and add the required Firebase configuration to your environment variables.

Example:
