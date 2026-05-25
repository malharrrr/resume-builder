FROM oven/bun:1 AS base
WORKDIR /app

RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-bibtex-extra \
    biber \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN bun install --no-cache

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]