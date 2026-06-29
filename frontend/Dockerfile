# build
FROM node:20 as build

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]