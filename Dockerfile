FROM node:18-alpine

# Security: Install Java aur Android SDK basics building ke liye
RUN apk add --no-cache openjdk11 bash git gradle zip unzip

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Projects runtime safe environment setup
RUN mkdir -p projects builds

EXPOSE 3000
CMD ["node", "server.js"]
