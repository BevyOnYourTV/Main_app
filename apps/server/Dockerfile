FROM node:24-alpine AS dependencies

WORKDIR /app

# Copy workspace manifests first so dependency installation can be cached.
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/sdk/package.json ./packages/sdk/package.json
COPY packages/simulator/package.json ./packages/simulator/package.json

RUN npm ci

FROM dependencies AS development

COPY apps/server ./apps/server
COPY packages/sdk ./packages/sdk

ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000 9229
CMD ["npm", "run", "start:debug", "--workspace", "server"]

FROM dependencies AS build

COPY apps/server ./apps/server
COPY packages/sdk ./packages/sdk

RUN npm run build --workspace server \
    && npm prune --omit=dev --workspace server

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/server/package.json ./apps/server/package.json
COPY --from=build --chown=node:node /app/apps/server/dist ./apps/server/dist
# npm workspaces link the SDK into node_modules; keep its target in the image.
COPY --from=build --chown=node:node /app/packages/sdk/package.json ./packages/sdk/package.json

USER node
EXPOSE 3000
CMD ["node", "apps/server/dist/main.js"]
