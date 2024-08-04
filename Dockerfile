FROM ubuntu:22.04

# Install various essential dependencies
RUN apt-get update && apt-get install -y curl gnupg zip unzip

# Install NodeJS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install BunJS
ENV BUN_INSTALL=$HOME/bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH=$PATH:$HOME/bun/bin

WORKDIR /app

COPY . .    

RUN apt-get update && apt-get install -y openssl1.1

WORKDIR /app/client
RUN bun i
RUN bun vite build

WORKDIR /app/server
RUN bun i
RUN bunx prisma generate
CMD ["bun", "src/server.ts"]
