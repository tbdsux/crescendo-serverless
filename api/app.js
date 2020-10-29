// initialize the .env config file
require('dotenv').config()

// main express
const express = require('express')
const app = express()

// other required
const path = require('path')
const bodyParser = require('body-parser')

// date parser
const moment = require('moment-timezone')

// set the view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'twig')

// set other things
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// form validation
const { body, validationResult } = require('express-validator')

// check if the env is set
if (!process.env.MONGO_DB) {
  console.log('The MONGO_DB environment variable is not set!')
  process.exit(0) // exit
}

// require the database connection
const ConDB = require('./db')

// default index route
app.get('/', async (req, res) => {
  res.render('terms')
})

// posts
app.get('/tweets', async (req, res) => {
  // connect to the db
  const db = await ConDB()

  // query the posts
  const posts = db.collection('PrivateTweets')
  posts
    .find()
    .sort({ date: -1 })
    .toArray((err, posts) => {
      res.render('posts', { posts, posts })
    })
})

// redirect to the personal admin
app.get('/' + process.env.ADMIN_DASH.trim(), async (req, res) => {
  // connect to the db
  const db = await ConDB()

  // query the posts
  const posts = db.collection('PrivateTweets')
  posts
    .find()
    .sort({ date: -1 })
    .toArray((err, posts) => {
      res.render('admin', { posts: posts })
    })
})
app.post(
  '/' + process.env.ADMIN_DASH.trim(),
  [
    body('post-content')
      .isLength({ min: 5 })
      .withMessage('Add more to your post!'),
  ],
  async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      res.render('admin', { errors: errors })
    } else {
      // insert the post
      const content = req.body['post-content']

      // connect to the db
      const db = await ConDB()

      // initialize the data to store
      const posts = await db.collection('PrivateTweets')
      const post = {
        content: content,
        date: moment()
          .tz(process.env.TIMEZONE.trim())
          .format('MMMM Do YYYY, h:mm:ss a'),
        uname: process.env.POST_UNAME.trim(),
      }

      // insert to the database
      posts
        .insertOne(post)
        .then((result) => {
          const success = 'You have successfully posted!'
          // query again the posts
          posts
            .find()
            .sort({ date: -1 })
            .toArray((err, posts) => {
              res.render('admin', { success: success, posts: posts })
            })
        })
        .catch((error) => {
          console.error(error) // log the error for future fixing
        })
    }
  },
)

// 404 error
app.use((req, res, next) => {
  res.status(404)
  res.render('error', { message: '404 Not Found!', status: 404 })
})

// export the app
module.exports = app
