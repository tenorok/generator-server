FROM node:<%= nodejs %>-alpine3.12

RUN apk add --no-cache tzdata && \
    mkdir /var/<%= project %>

WORKDIR /var/<%= project %>

COPY docker/secrets/get.js docker/secrets/get.js
COPY node_modules_production/node_modules node_modules
COPY package.json package.json
COPY app/pm2.config.js pm2.config.js
COPY config config
COPY app/dist dist

USER node
