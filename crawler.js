/**
 * Created by Eugene on 2017/5/23.
 * 简单爬虫爬取网站图片
 */
const fs = require('fs');
const path = require('path')
const request = require('request');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');
const Async = require('async');
const phantom = require('phantom');

const links = [];
const url = 'http://m.leoao.com/act/youth_fit';
const dir = '/Users/Eugene/Desktop/crawler';
mkdirp(dir, function (err) {
    if (err) console.log(err);
})

var webpage = async () => {
    const instance = await phantom.create();
    const page = await instance.createPage();
    await page.on("onResourceRequested", function (requestData) {
        console.info('Requesting=======>', requestData.url)
    });
    const status = await page.open(url);
    console.info('open =======>', status);
    const content = await page.property('content');
    await instance.exit();

    const $ = cheerio.load(content);
    $('img').each(function () {
        var src = $(this).attr('src');
        links.push(src);
    })
    Async.mapSeries(links, function (item, callback) {
        let url = item
        if (item.search(/http|https/) !== -1) {
            url = item
        } else {
            url = 'http:' + url
        }
        download(url, dir, path.basename(item));
        callback(null, item);
    }, function (err, results) {
        if (!err) {
            console.log('\\(^o^)/~ download completed！！！')
        }
    });
};

//下载方法
var download = (url, dir, filename) => {
    request.head(url, function (err, res, body) {
        request(url).pipe(fs.createWriteStream(dir + "/" + filename));
    });
};

//启动
webpage();
