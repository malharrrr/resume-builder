FROM oven/bun:1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-bibtex-extra \
    biber \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]