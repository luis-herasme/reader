## Requirements
- [Node.js](https://nodejs.org/en/) (npm)
- [Bun](https://bun.sh/) (bun)

## Installation
After cloning the repository, you need to install the dependencies using the following command:
```bash
bun i
```

## Usage
Before starting the server, you need to create a `.env` file in the server directory with the following content:
```env
DATABASE_URL="<DATABASE_URL>"
GOOGLE_CLIENT_ID="<GOOGLE_CLIENT_ID>"
GOOGLE_CLIENT_SECRET="<GOOGLE_CLIENT_SECRET>"
BASE_URL="http://localhost:3000"
DATA_URL="<DATA_URL>"
```

To start the server and the client, use the following command in the root directory:
```bash
npm run dev
```
