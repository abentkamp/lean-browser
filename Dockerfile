FROM ubuntu:22.04

RUN apt-get update
RUN apt-get -y install npm

WORKDIR /app
RUN apt-get install -y curl        
RUN curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh -s -- -y
RUN ~/.elan/bin/elan self update
RUN ~/.elan/bin/elan default leanprover/lean4:nightly

ENV PATH="${PATH}:/root/.elan/bin/"


WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

WORKDIR /app/websocket-server
RUN npm install



WORKDIR /app
# CMD npm run start