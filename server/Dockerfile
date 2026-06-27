FROM node:18-bullseye as build
WORKDIR /build
COPY package*.json .
COPY src/ src/
COPY tsconfig.json .
RUN npm install
RUN npm run build

FROM node:18-bullseye as runner
WORKDIR /app

# Install Python, GCC, G++, and OpenJDK (Java)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Add python symlink
RUN ln -sf /usr/bin/python3 /usr/bin/python

COPY package*.json .
COPY --from=build build/node_modules/ node_modules/ 
COPY --from=build build/build/ build/
EXPOSE 8000
CMD [ "node","build/index.js"]
