# ---------- Build Stage ----------
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# -------- Runtime Stage --------
FROM node:20

WORKDIR /app

# Copy built output
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

RUN npm install --omit=dev



EXPOSE 4000

# Start Angular SSR server
CMD ["node", "dist/frontend/server/server.mjs"]
