const cheerio = require('cheerio')
const pageLoader = require('./pageLoader')

/**
 * Finds and returns the three links from the startpage to the calendarpage, cinemapage and restaurantpage
 *
 * @param {*} html - The html to find the links in
 * @returns
 */
async function getPageLinks (html) {
  try {
    const $startPage = cheerio.load(html)
    const pageLinks = []

    $startPage('li a').each((index, element) => {
      pageLinks.push($startPage(element).attr('href'))
    })
    return pageLinks
  } catch (err) {
    console.error(err)
  }
}

/**
 * Returns the calendarlinks for each person
 *
 * @param {*} url - The baseurl of the calendarpage
 * @param {*} html - The html to use to get the linsk for each calendar
 * @returns
 */
async function getCalendarLinks (url, html) {
  try {
    const $calendarPage = cheerio.load(html)
    const calendarLinks = []

    $calendarPage('li a').each((index, element) => {
      const href = $calendarPage(element).attr('href')
      calendarLinks.push(url + href)
    })

    return calendarLinks
  } catch (err) {
    console.error(err)
  }
}

/**
 * Get the valid days for each person
 *
 * @param {*} calendarLinks - The links of each calendarpage
 * @param {*} html - The html to get the valid days from
 * @returns
 */
async function getValidDays (calendarLinks, html) {
  try {
    const validDays = []
    await Promise.all(calendarLinks.map(async (link) => {
      const calendarHtml = await pageLoader.getPage(link)
      const $ = cheerio.load(calendarHtml)
      const name = $('h2').text()

      // Checks each tablecell and goes up to the table cell head to get the text of what day it belongs to
      $('tbody tr td').each((index, element) => {
        const dayValid = $(element).text().toLowerCase()
        const day = $(element).closest('table').find('thead tr th').eq(index).text()
        if (dayValid === 'ok') {
          let availableDays = {
            name: name,
            day: day,
            dayValid: dayValid

          }
          validDays.push(availableDays)
        }
      })
    }))
    return validDays
  } catch (err) {
    console.error(err)
  }
}

/**
 * Returns an array of available movie objects
 *
 * @param {*} movies - Array of movies with free seats
 * @param {*} html - The html to get the movies properties from
 * @returns
 */
async function getAvailableMovies (movies, html) {
  try {
    const $cinemaPage = cheerio.load(html)
    const availableMovies = []

    for (let movie of movies) {
      const selector = `#movie option[value="${movie.movie}"]`
      const text = $cinemaPage(selector).text()
      let availableMovie = {
        title: text,
        startTime: movie.time.substring(0, 2),
        day: movie.day
      }
      availableMovies.push(availableMovie)
    }
    return availableMovies
  } catch (err) {
    console.log(err)
  }
}

/**
 * Returns an arry of available times at the restaurantpage
 *
 * @param {*} movies - Array of movies showing on the free days
 * @param {*} html - Html to get the restaurant times from
 * @returns
 */
async function getRestaurantTimes (movies, html) {
  try {
    const $ = cheerio.load(html)
    const restaurantTimes = []

    $('p b span').each((index, element) => {
      const day = $(element).text()
      let selector = ''
      if (day === 'Friday' && movies.filter(e => e.day === '05').length > 0) {
        selector = 'div.WordSection2 span'
      } else if (day === 'Saturday' && movies.filter(e => e.day === '06').length > 0) {
        selector = 'div.WordSection4 span'
      } else if (day === 'Sunday' && movies.filter(e => e.day === '07').length > 0) {
        selector = 'div.WordSection6 span'
      }

      $(selector).each((index, element) => {
        const text = $(element).text()
        if (text.includes('Free')) {
          const startTime = text.substring(0, 2)
          const endTime = text.substring(3, 5)
          let time = {
            day: day,
            startTime: startTime,
            endTime: endTime
          }
          restaurantTimes.push(time)
        }
      })
    }
    )
    return restaurantTimes
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  getPageLinks: getPageLinks,
  getCalendarLinks: getCalendarLinks,
  getValidDays: getValidDays,
  getAvailableMovies: getAvailableMovies,
  getRestaurantTimes: getRestaurantTimes
}
