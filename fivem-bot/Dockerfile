FROM node:20

WORKDIR /usr/src/app

# Dosyaları fivem-bot alt klasöründen çekmesini açıkça söylüyoruz
COPY fivem-bot/package*.json ./

RUN npm install

COPY fivem-bot/ .

CMD [ "node", "index.js" ]
