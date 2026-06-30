
FROM node:20
 
WORKDIR /app
 
# Install dependencies
COPY package*.json ./
RUN npm ci
 
# Copy Prisma schema before generation
COPY prisma ./prisma
 
# Generate Prisma client
RUN npx prisma generate
 
# Copy the rest of the source code
COPY . .
 
CMD ["node", "src/workers/envioContrachequeWorker.js"]
 