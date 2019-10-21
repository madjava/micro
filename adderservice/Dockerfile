FROM node:slim

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install --assume-yes git

WORKDIR /home/node/service

COPY package.json .
RUN npm install

COPY . .
CMD ["node", "index.js"]