#!/bin/bash

# update deps
sudo apt update
sudo apt install -y curl git

# setup package manager to use node 16
curl -sL https://deb.nodesource.com/setup_16.x | sudo bash

# install node 16
sudo apt install -y nodejs

# double check we have the right node version
node -v