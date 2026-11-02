FROM node:24.11.1-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN DIRECT_DATABASE_URL=postgresql://build:build@localhost:5432/build npm run prisma:generate
EXPOSE 3000
CMD ["npm","run","start:dev"]
FROM development AS build
RUN npm run build
FROM node:24.11.1-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY prisma ./prisma
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init","--"]
CMD ["node","dist/main.js"]
