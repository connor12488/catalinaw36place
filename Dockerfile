FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY agent/package*.json ./agent/

RUN npm install

COPY . .

RUN npm run build

ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]