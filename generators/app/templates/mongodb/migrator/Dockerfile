FROM node:<%= nodejs %>-alpine3.12
RUN mkdir /var/<%= project %>-migrator
WORKDIR /var/<%= project %>-migrator

COPY docker/secrets/get.js docker/secrets/get.js
COPY node_modules_production/node_modules node_modules
COPY migrator/pm2.config.js pm2.config.js
COPY config config
COPY migrator/dist dist

USER node
