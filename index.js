
const { TwitterApi } = require('twitter-api-v2');
const nodeHtmlToImage = require('node-html-to-image');
const { config } = require('./config.js');
const schedule = require('node-schedule');
const fs = require('fs');
const rule = new schedule.RecurrenceRule();
//rule.hour= config.HOUR;
//rule.minute = config.MIN;
rule.minute = new schedule.Range(0, 59, 2);


const express = require('express');
const app = express();
const PORT = process.env.PORT || 3300;

app.use(express.static('public'));
app.use('/images', express.static('images'));

const client = new TwitterApi({
  appKey: config.APP_KEY,
  appSecret: config.APP_SECRET,
  accessToken: config.ACCESS_TOKEN,
  accessSecret: config.ACCESS_SECRET
});

const axios = require('axios');

app.get("/", (req, res) => {
  res.send("Window Service!");
})

const apiCall = () =>{
  axios.get(config.API_URL_1)
  .then(response => {
    if(response){
      let fVal = response.data.split('\r\n');
      let val = fVal[0].split('|');
      let stockName = val[0];
      let date = new Date(val[2].split(' ')[0]).toDateString().split(' ').slice(1).join(' ');
  
      console.log(stockName + " " + date);
      nodeHtmlToImage({
        output: './image.png',
        html: `<html>
          <head>
            <style>
              body {
                padding:10px;
                width:470px; height: 410px;
              }
              .container{
                border:1px solid #000; width:450px; min-height: 395px; margin: auto; padding: 5px;
              }
              .main{
                background-image: url("http://localhost:3300/images/tweet-bg.png"); width: 100%; min-height: 320px; background-size: 85%; background-repeat:no-repeat; background-position: top right; position: relative; 
              }
              .date{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                position: absolute;
                top: 18%;
                right: 10%;
                color: #fff;
                width: 10%;
                text-align: center;
              }
              .stockName{
                font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:22px; text-transform:uppercase; position:absolute; top:47%; left: 22%;
                width: 59%; text-align: center; text-shadow: 0 2px 1px #fff;
              }
            </style>
          </head>
          <body>
          <div class='container'>
          <div class="main">
              <span class='date'>${date}</span>
              <span class='stockName'>${stockName}</span>    
          </div>
          <div>
              <img src="http://localhost:3300/images/tweet-footer.png" style="width:100%" />
          </div>
          </div>
          </body>
        </html>
        `
      })
        .then(async () => {
          console.log('The image was created successfully!')
          const mediaIds = await Promise.all([
            // file path
            client.v1.uploadMedia('./image.png'),
          ]);
  
          // mediaIds is a string[], can be given to .tweet
           await client.v1.tweet('', { media_ids: mediaIds });
        })
    }
    else{
      console.log("No Data Found!");
    }
  })
  .catch(error => {
    console.log(error);
  });
}

const job = schedule.scheduleJob(rule, function () {
  const path = './image.png';
  if (fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
      apiCall();
      //file removed
    } catch (err) {
      console.error(err)
    }
  }
  else{
    apiCall();
  }


});



app.listen(PORT, () => {
  console.log(`Running server on PORT ${PORT}...`);
})
