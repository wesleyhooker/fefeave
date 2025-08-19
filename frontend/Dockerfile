# Use Node image for building
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Use nginx to serve the built static site
FROM nginx:alpine
COPY --from=builder /app/dist/fefeave /usr/share/nginx/html
EXPOSE 80
