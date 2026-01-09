# babysitter-Companion

A mobile-friendly React app that helps babysitters log childcare events quickly and send SMS-ready reports and alerts to parents in their preferred language, powered by AI translation.

<img width="995" height="758" alt="Screenshot 2025-12-06 at 11 24 14 PM" src="https://github.com/user-attachments/assets/4c221407-d6ca-4ff0-9cc8-86358774d8e8" />

<img width="1209" height="633" alt="Screenshot 2025-12-06 at 11 24 22 PM" src="https://github.com/user-attachments/assets/79461095-d972-4400-83f6-669f6411c619" />

<img width="846" height="811" alt="Screenshot 2025-12-06 at 11 24 49 PM" src="https://github.com/user-attachments/assets/2d21f13d-0a3d-44ca-b7a9-39d924133746" />

<img width="737" height="477" alt="Screenshot 2025-12-06 at 11 25 26 PM" src="https://github.com/user-attachments/assets/29a3a53e-6876-4d15-8492-671f9114053d" />

<img width="715" height="815" alt="Screenshot 2025-12-07 at 5 41 00 AM" src="https://github.com/user-attachments/assets/2680a53d-8c28-41e3-a721-e17662e56360" />

<img width="1388" height="1184" alt="image" src="https://github.com/user-attachments/assets/ed2edf25-d401-45f6-8467-21266938b6f5" />


<img width="895" height="791" alt="Screenshot 2025-12-07 at 5 40 08 AM" src="https://github.com/user-attachments/assets/143e5fb6-29b0-4182-9ab3-797158190be7" />

## Features

- **Per-child profiles**
  - Add children with name, photo, parent phone number, and parent language.
  - Support for an “Other” option where the babysitter can type any language name (e.g. `Urdu`, `Somali`).
  - Data is stored in `localStorage` so the app remembers kids across sessions.

- **Fast activity logging**
  - One-tap logging for common events: Nap, Diaper, Meal etc.
  - Inline per-log notes for extra context (e.g. “Ate half the bottle, seemed fussy”).
  - Each child has a timeline of their activities, persisted per child.

- **AI-powered multilingual parent reports**
  - Automatically generates a daily summary for each child from today’s logs and notes.
  - Uses Reagent to translate the entire report (including notes) into the parent’s language.
  - Handles:
    - Built-in languages (English, Spanish, Chinese, etc.).
    - Custom languages via the “Other” option (free-text language name).

- **SMS-ready messaging**
  - Each child has a stored parent phone number.
  - Parent Reports page shows a preview modal with the translated message.
  - One click to copy the message or open the SMS app with the body pre-filled (device-dependent).

- **Emergency alerts**
  - Babysitter can send common alerts (e.g. fire drill, medical issue) once.
  - The app translates the alert per parent language and prepares per-parent messages.
  - “Send to all” flow that confirms and then reports “Message sent to all parents”.

- **Mobile-first, one-hand-friendly design (WIP)**
  - Large touch targets, minimal text input, and simple flows designed for babysitters who may be holding a child in one arm.

---

## AI Translation

The app does not hard-code translations.

Instead, it:

1. Builds the full message in English on the client:
   - For reports: header + numbered list of events + per-log notes.
   - For alerts: the alert text the babysitter edits.
2. Sends that message to Reagent via an HTTP `POST` request:
   - `message`: full English text.
   - `target_language`: normalized language name (e.g. `Spanish`, `Chinese (Mandarin)`, `Urdu`).
3.  LLM (`openai/gpt-5-mini`) to translate the text.
4. The app receives plain translated text and displays it in the Parent Reports / Alerts UI.

> The URL and API key are kept out of version control and configured locally.

---

## Tech Stack

- **Frontend:** React + Vite (JavaScript, JSX)
- **Styling:** Custom CSS (`App.css`, `index.css`)
- **State & storage:** React hooks + `localStorage`
- **AI translation:** Reagent
- **Platform:** Web / mobile web

---

## Project Structure

```text
web/
  src/
    App.jsx      # Main app shell + all page components
    App.css      # Global styles
    main.jsx     # React/Vite entry point
```
    
Key components inside App.jsx:

HomePage – main menu for navigation.

ChildrenPage – list of children, search, and Add Child modal.

ChildDetailPage – per-child activity logging and timeline (Nap/Diaper/Meal + notes).

ParentReportsPage – per-child language & phone, AI-generated daily reports, SMS preview.

AlertPage – emergency broadcasts translated per parent language.

UserProfilePage – babysitter profile (optional, mostly cosmetic).


## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal output).

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```
