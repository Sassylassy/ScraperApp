const pageLoader = require('./pageLoader')
const htmlEvaluator = require('./htmlEvaluator')

let pageLinks = []

/**
 * Starts the webscraping
 *
 * @param {*} url - Start url
 */
async function scrape (url) {
  try {
    const html = await pageLoader.getPage(url)
    pageLinks = await htmlEvaluator.getPageLinks(html)

    checkValidDays(pageLinks[0])
    console.log('Webagent start running...\n')
    console.log('Fetching links... OK')
  } catch (err) {
    console.error(err)
  }
}

/**
 * Returns the valid days
 *
 * @param {*} url - Url of the calendarpage
 * @returns
 */
async function scrapeValidDays (url) {
  try {
    const html = await pageLoader.getPage(url)
    const calendarLinks = await htmlEvaluator.getCalendarLinks(url, html)
    const validDays = await htmlEvaluator.getValidDays(calendarLinks, html)
    console.log('Finding free days... OK')
    return validDays
  } catch (err) {
    console.error(err)
  }
}

/**
 * Sets the day/s when all persons are available
 *
 * @param {*} url
 */
async function checkValidDays (url) {
  const validDays = await scrapeValidDays(url)
  let availableDays = validDays.reduce((acc, curr) => {
    acc[curr.day] = (acc[curr.day] || 0) + 1
    return acc
  }, {})
  const freeDays = []
  for (var key in availableDays) {
    if (availableDays[key] === 3) {
      if (key === 'Friday') {
        freeDays.push('05')
      } else if (key === 'Saturday') {
        freeDays.push('06')
      } else {
        freeDays.push('07')
      }
    }
  }
  scrapeMovies(freeDays)
}

/**
 * Get the movies that are showing on the free day/s
 *
 * @param {*} freeDays - The days when all persons are available
 */
async function scrapeMovies (freeDays) {
  try {
    const movieNumbers = ['01', '02', '03']
    const movieLinks = []
    const movies = []
    for (let i = 0; i < freeDays.length; i++) {
      for (let j = 0; j < movieNumbers.length; j++) {
        movieLinks.push(`${pageLinks[1]}/check?day=${freeDays[i]}&movie=${movieNumbers[j]}`)
      }
    }

    await Promise.all(movieLinks.map(async (link) => {
      try {
        const movieHtml = await pageLoader.getPage(link)
        const moviesArray = await JSON.parse(movieHtml)
        for (let movie of moviesArray) {
          if (movie.status === 1) {
            movies.push(movie)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }))
    scrapeAvailableMovies(movies, freeDays)
  } catch (err) {
    console.error(err)
  }
}

/**
 * Gets and array of objects with title, start time and day of the available movies
 *
 * @param {*} movies - Arry of movies to get the movies properties from
 * @param {*} days - The free days
 */
async function scrapeAvailableMovies (movies, days) {
  try {
    const html = await pageLoader.getPage(pageLinks[1])
    const availableMovies = await htmlEvaluator.getAvailableMovies(movies, html)
    console.log('Fetching movie shows... OK')
    scrapeRestaurantTimes(availableMovies, days)
  } catch (err) {
    console.log(err)
  }
}

/**
 * Get an array of objects with day and start and endtime of free restaurant bookings
 *
 * @param {*} movies
 * @param {*} days
 */
async function scrapeRestaurantTimes (movies, days) {
  try {
    const html = await pageLoader.fetchPage()
    const restaurantTimes = await htmlEvaluator.getRestaurantTimes(movies, html)
    console.log('Fetching restaurant bookings... OK')
    presentResults(movies, restaurantTimes)
  } catch (err) {
    console.log(err)
  }
}

/**
 * Present the recommendations for movies and restaurant times on the days when all persons are available
 *
 * @param {*} movies
 * @param {*} restaurantTimes
 */
function presentResults (movies, restaurantTimes) {
  console.log('Putting together recommendations... OK\n')
  for (let movie of movies) {
    for (let booking of restaurantTimes) {
      if (movie.day === '05') {
        movie.day = 'Friday'
      } else if (movie.day === '06') {
        movie.day = 'Saturday'
      } else if (movie.day === '07') {
        movie.day = 'Sunday'
      }
      if (movie.day === booking.day && booking.startTime - movie.startTime === 2) {
        if (process.argv[2] === 'http://cscloud304.lnu.se:8080') {
          console.log(`* On ${movie.day} the movie ${movie.title} starts at ${movie.startTime}:00 and there is a free table between ${booking.startTime}:00 and ${booking.endTime}:00.\n`)
        } else {
          console.log(`* On ${movie.day} there is a free table between ${booking.startTime}:00 and ${booking.endTime}:00, after you have seen ${movie.title} which starts at ${movie.startTime}:00.\n`)
        }
      }
    }
  }
}

module.exports = {
  scrape: scrape
}
