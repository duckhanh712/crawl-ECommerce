#!/bin/bash
docker-compose -f docker-compose.local.yml up -d
export PORT=3003
export MONGODB_URI=mongodb://localhost:27017/cz-crawl-data
export SHOPEE_API=http://shopee.vn/api
export AUTO_INDEX=true
export CHOZOI_API=https://api.chozoi.com
export JWT_KEY=ohcioz
export TTS_API=https://thitruongsi.com
export ZASI_API=https://dev.api.zasi.vn
export SENDO_HTTP=https://www.sendo.vn
npm run dev
# npm run start
