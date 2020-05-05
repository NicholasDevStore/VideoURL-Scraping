const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const writeStream = fs.createWriteStream("post.json");

request("https://www.what-song.com/movies/browse", (err, response, html) => {
  const datas = [];
  if (!err && response.statusCode == 200) {
    const $ = cheerio.load(html);
    const listMovies = $(".browse-all-wrapp");
    $(".browse-item .browse-table .browse-table__coll a").each((i, el) => {
      const item = $(el).text();
      const link = $(el).attr("href");
      const data = {};
      data.caption = item;
      data.link = link;
      datas.push(data);
    });
    writeStream.write(JSON.stringify(datas));
  }
});
