FROM node:10.15.1-alpine
ENV NODE_ENV=production
WORKDIR /data
ARG NPM_TOKEN

RUN apk add --update --no-cache curl && rm -rf /var/cache/apk/*

COPY package.json package.json
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc \
    && yarn install \
    && rm ~/.npmrc

COPY . .

EXPOSE 3000
CMD [ "yarn", "start" ]
