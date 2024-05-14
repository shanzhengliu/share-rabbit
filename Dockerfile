FROM node:18-alpine as source
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
RUN npm install

COPY . /app
RUN npm run build

FROM node:alpine
WORKDIR /app
COPY --from=source /app /app
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD [ "npm", "start" ]