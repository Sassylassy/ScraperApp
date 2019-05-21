const scraper = require('./src/scraper')

const url = process.argv[2] || 'http://vhost3.lnu.se:20080/weekend'

scraper.scrape(url)
