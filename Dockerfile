FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

RUN apk add --no-cache jq

COPY --from=build /app/dist ./dist
COPY server ./server
COPY run.sh /run.sh

RUN chmod +x /run.sh

EXPOSE 3000

CMD ["/run.sh"]
