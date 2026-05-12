FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN chmod +x start.sh

EXPOSE 3000

CMD ["sh", "start.sh"]
