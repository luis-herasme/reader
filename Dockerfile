FROM ubuntu:22.04

# Install various essential dependencies
RUN apt-get update && apt-get install -y curl gnupg zip unzip

# Install NodeJS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

COPY . .

WORKDIR /app/client
RUN npm install
RUN npx vite build

WORKDIR /app/server
RUN npm install
RUN npx prisma generate
CMD ["npx", "tsx", "src/server.ts"]
