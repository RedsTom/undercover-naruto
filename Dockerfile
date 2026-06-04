FROM oven/bun:1.3.14 AS build

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:1.3.14-slim

WORKDIR /app

COPY --from=build /app/.output ./.output
COPY --from=build /app/data ./data

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]