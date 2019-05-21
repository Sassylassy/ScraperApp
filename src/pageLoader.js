const request = require('request-promise')
const fetch = require('fetch-cookie/node-fetch')(require('node-fetch'))

/**
 * Makes a request for the provided url and returns the response
 *
 * @param {*} url - The url to request
 * @returns
 */
async function getPage (url) {
  try {
    return await request(url)
  } catch (err) {
    console.error(err)
  }
}

/**
 * Logs in to the restaurantpage and returns a response with the pages html
 *
 * @returns
 */
async function fetchPage () {
  try {
    const html = await fetch('http://vhost3.lnu.se:20080/dinner/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'username=zeke&password=coys'
    })
    return await html.text()
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  getPage: getPage,
  fetchPage: fetchPage
}
