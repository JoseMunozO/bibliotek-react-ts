# Bibliotek – frontend

Webbgränssnitt för biblioteksystemet **Bibliotek**, byggt med React, TypeScript och Tailwind CSS. Applikationen pratar med REST-API:t [bibliotek-api](https://github.com/JoseMunozO/bibliotek-api) (Java 25 + Spring Boot + MySQL).

## Funktioner

- **Böcker** – lista med sökning på titel eller författare, och en detaljsida med kategorier, ISBN, språk, antal sidor och tillgängliga exemplar.
- **Recensioner** – alla recensioner av en bok med genomsnittligt betyg, samt ett formulär för att skriva en ny (1–5 stjärnor). Endast medlemmar som har lämnat tillbaka boken kan recensera den.
- **Mest utlånade** – topplista med stapeldiagram (topp 5, 10, 20 eller 50).
- **Medlemmar** – registrera nya medlemmar, se en medlems profil med lån, böter och statistik, redigera uppgifter och medlemskapstyp, betala böter och stänga av medlemmar.
- **Lån** – nya lån (14 dagars lånetid), förlängning, återlämning med automatisk förseningsavgift och en lista över försenade lån.
- **Aviseringar** – en medlems aviseringar med filter för olästa, markera som läst och skicka nya aviseringar.

Det finns ingen inloggning: rollerna simuleras genom att man väljer vilken medlem man arbetar med.

## Teknik

| | |
|---|---|
| Ramverk | React 19 |
| Språk | TypeScript 6 |
| Byggverktyg | Vite 8 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Kodkvalitet | ESLint med `typescript-eslint` och `react-hooks` |

Projektet har inga andra körtidsberoenden: API-klienten bygger på `fetch` och navigeringen sköts med flikar i stället för en router.

## Kom igång

### Krav

- Node.js 20.19+ eller 22.12+ (testat med Node 24)
- Backend [bibliotek-api](https://github.com/JoseMunozO/bibliotek-api) igång på `http://localhost:8090` – se dess README för databas och miljövariabler

### Installation

```bash
git clone https://github.com/JoseMunozO/bibliotek-react-ts.git
cd bibliotek-react-ts
npm install
npm run dev
```

Öppna sedan http://localhost:5173. Om porten är upptagen kan du välja en annan med `npm run dev -- --port 5174`.

### Skript

| Kommando | Beskrivning |
|---|---|
| `npm run dev` | Startar utvecklingsservern med hot reload |
| `npm run build` | Typkontrollerar (`tsc -b`) och bygger till `dist/` |
| `npm run preview` | Förhandsgranskar produktionsbygget lokalt |
| `npm run lint` | Kör ESLint |

## Koppling till API:t

Under utveckling skickar Vites proxy alla anrop till `/api` vidare till `http://localhost:8090`, så det behövs ingen CORS-konfiguration. Proxyn tar bort `Origin`-headern, vilket gör att det fungerar även om Vite körs på en annan port än 5173.

För ett produktionsbygge mot en annan server anger du API:ts adress i en `.env.local`-fil:

```bash
VITE_API_URL=https://min-server.se/api
```

## Projektstruktur

```
src/
├── api/
│   ├── types.ts       # TypeScript-typer som speglar API:ts DTO:er
│   ├── client.ts      # fetch-omslag, ApiError och getErrorMessage
│   └── index.ts       # booksApi, membersApi, loansApi, notificationsApi
├── components/        # Återanvändbara komponenter (Button, Input, Badge, Alert, Stars …)
│                      # och formulär (NewMemberForm, NewLoanForm, NewReviewForm …)
├── pages/             # En sida per vy: böcker, mest utlånade, medlemmar, lån, aviseringar
├── utils.ts           # Datum, belopp och etiketter för statusar
├── App.tsx            # Layout med navigeringsflikar
└── index.css          # Endast @import "tailwindcss"
```

## Använda API-klienten

Komponenterna anropar aldrig `fetch` direkt, utan går via objekten i `src/api`:

```ts
import { booksApi, loansApi, getErrorMessage } from '../api'

const books = await booksApi.list({ search: 'tolkien' })
const { fineAmount } = await loansApi.return(42)

try {
  await loansApi.create({ memberId: 1, bookId: 54 })
} catch (error) {
  // Meddelandet kommer från backend och kan visas direkt för användaren
  setError(getErrorMessage(error))
}
```

Alla fel från API:t har formen `{ status, message }` och kastas som `ApiError`. Gränssnittet är på spanska, liksom felmeddelandena från backend.

## Licens

Projektet är licensierat under [MIT-licensen](LICENSE).
