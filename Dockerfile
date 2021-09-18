FROM node:12.18.4-alpine

RUN apk add --no-cache chromium --repository=http://dl-cdn.alpinelinux.org/alpine/v3.12/main
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3003
CMD [ "npm", "run", "start" ]
