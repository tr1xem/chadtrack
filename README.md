# ChadForce 🗿

A high-performance Codeforces tracker designed for serious competitive programmers. ChadForce doesn't just track your solved problems; it enforces a disciplined training routine to help you level up faster.

## 🚀 Philosophy: The 50/30/20 Rule

ChadForce generates daily problem blocks based on your `Target Rating`. To ensure balanced growth, every block follows a strict distribution:

- **50%** of problems at your **Target Rating** (Solidify fundamentals)
- **30%** of problems at **Target + 100** (Push your limits)
- **20%** of problems at **Target + 200** (Expand your horizons)

Solve **50 problems** at your target rating to automatically "Level Up" and increase your target.

## ✨ Features

- **Daily Blocks**: Fresh problems served every day scaled to your custom daily goal.
- **Streak System**: Keep the fire burning. Daily solves maintain your streak.
- **Level Up Progress**: Visual progress bar showing how close you are to your next rating milestone.
- **Settings**: Customize your Codeforces handle, target rating, and daily problem limit.
- **Sleek UI**: Premium dark-mode interface built with Next.js, Tailwind CSS, and Shadcn UI.

## 🛠️ Setup

### 1. Prerequisites

- Node.js 18+
- MongoDB (Atlas or Local)
- Codeforces Handle

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Installation

```bash
npm install
npm run dev
```

## 🏗️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

*Built for the Chads of Competitive Programming.*
