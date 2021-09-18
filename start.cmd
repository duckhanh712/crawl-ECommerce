docker-compose -f docker-compose.local.yml up -d
set PORT=3003
set MONGODB_URI=mongodb://localhost:27017/cz-crawl-data
set SHOPEE_API=http://shopee.vn/api
set AUTO_INDEX=true
set CHOZOI_API=https://api.chozoi.com
set JWT_KEY= ohcioz
set TTS_API=https://thitruongsi.com
set ZASI_API=https://dev.api.zasi.vn
set SENDO_HTTP=https://www.sendo.vn
npm run dev
