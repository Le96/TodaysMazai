const express = require('express')
const router = express.Router()

// GET homepage
router.get('/', (req, res, next) => {
  res.render('index', {title: '#TodaysMazai'})
})

module.exports = router
