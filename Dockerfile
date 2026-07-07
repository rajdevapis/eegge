FROM node:18-alpine

# Android SDK & Zip Utilities
RUN apk add --no-cache openjdk11 bash git gradle zip unzip

WORKDIR /usr/src/app

# Install Node modules
COPY package*.json ./
RUN npm install

# Copy complete project
COPY . .

# Secure Runtime Folders
RUN mkdir -p projects builds

EXPOSE 3000
CMD ["node", "server.js"]
