#!/usr/bin/env node

/**
 * @file qtool.js
 * @author karos
 */
var os = require('os');
var fs = require('fs');
var path = require('path');
var util = require('util');
var Promise = require('promise');
var co = require("co");
var request = require('request');
var mkdirp = require('mkdirp');
var program = require('commander');
var path = require('path');
var qn = require('qn');
var glob = require('glob');
var thunkify = require("thunkify");
var readdir = thunkify(glob);

(function () {
    program.version('0.0.6')
        .usage('One tool to upload resource to qinniu')
        .option('-f, --folder <string>', 'Resource forder')
        .option('-k, --keypreffix <string>', 'Key preffix')
        .option('-a, --accessKey <string>', 'Access Key. Will be stored when first set')
        .option('-s, --secretKey <string>', 'Secret Key. Will be stored when first set')
        .option('-b, --bucket <string>', 'Bucket to store image. Will be stored when first set')
        .option('-o, --origin <string>', 'Bucket URL. Will be stored when first set')
    program.command('upload')
        .description('upload files to cdn')
        .action(function () {
            init(uploadResourceToCdn)
    });
    program.command('download')
        .description('download files from cdn')
        .action(function () {
            init(downloadResourceFromCdn)
    });
    program.parse(process.argv)
})();

function init(fn) {
    var accessKey = program.accessKey;
    var secretKey = program.secretKey;
    var keypreffix = program.keypreffix;
    var bucket = program.bucket;
    var folder = program.folder;
    var origin = program.origin;

    var needUpdateKey = false;
    var qtoolJson = readKey();

    if (isUndifined(folder)) {
        console.log('Missing parameter folder');
        return;
    }

    if (isUndifined(accessKey) && isUndifined(qtoolJson.accessKey)) {
        console.log('Missing parameter accessKey');
        return;
    } else if (!isUndifined(accessKey)) {
        qtoolJson.accessKey = accessKey;
        needUpdateKey = true;
    }

    if (isUndifined(secretKey) && isUndifined(qtoolJson.secretKey)) {
        console.log('Missing parameter secretKey');
        return;
    } else if (!isUndifined(secretKey)) {
        qtoolJson.secretKey = secretKey;
        needUpdateKey = true;
    }
    if (isUndifined(origin) && isUndifined(qtoolJson.origin)) {
        console.log('Missing parameter origin');
        return;
    } else if (!isUndifined(origin)) {
        qtoolJson.origin = origin;
        needUpdateKey = true;
    }

    folder = path.resolve(folder);
    if (isUndifined(bucket) && isUndifined(qtoolJson[folder])) {
        console.log('Missing parameter bucket');
        return;
    } else if (!isUndifined(bucket)) {
        qtoolJson[folder] = bucket;
        needUpdateKey = true;
    }

    if (isUndifined(bucket) && isUndifined(qtoolJson[folder])) {
        console.log('Missing parameter bucket');
        return;
    } else if (!isUndifined(bucket)) {
        qtoolJson[folder] = bucket;
        needUpdateKey = true;
    }

    needUpdateKey && writeKey(qtoolJson);
    var client = qn.create({
        accessKey: qtoolJson.accessKey,
        secretKey: qtoolJson.secretKey,
        bucket: qtoolJson[folder],
        origin: qtoolJson.origin,
    })
    fn && fn(client, folder, keypreffix, qtoolJson.origin)
}

function* getResourcesPath(folder) {
    var pattern = folder + '/**/*.{jpg,png,svg,html,js,css}';
    var files = yield readdir(pattern, {nodir: true, realpath: true});

    return files;
}

function isUndifined(value) {
    return typeof(value) === 'undefined';
}

function writeKey(qtoolJson) {
    qtoolJson = qtoolJson || {};

    try {
        var qtoolConfigFilePath = path.join(os.homedir(), '.qtool');
        var configStr = JSON.stringify(qtoolJson, null, 4);
        fs.writeFileSync(qtoolConfigFilePath, configStr);
    } catch (err) {
        console.log(err);
    }
}

function readKey() {
    var qtoolJson;
    try {
        var qtoolConfigFilePath = path.join(os.homedir(), '.qtool');
        console.log('Reading key from ' + qtoolConfigFilePath);
        var qtoolContent = fs.readFileSync(qtoolConfigFilePath);
        qtoolJson = JSON.parse(qtoolContent);
    } catch (err) {
    }

    return qtoolJson || {};
}

function uploadResourceToCdn(client, folder, keypreffix) {
    var baseFolder = path.resolve(folder);
    co(getResourcesPath(baseFolder)).then(function (files) {
        var allPromise = files.map(function (file) {
            var filePath = file;
            var index = file.indexOf(baseFolder) + baseFolder.length + 1;
            var keyName = file.substring(index);
            if (!isUndifined(keypreffix)) {
                keyName = path.join(keypreffix, '/', keyName);
            }
            return new Promise(function (resolve, reject) {
                client.uploadFile(filePath, {key: keyName}, function (err, result) {
                    if (!err) {
                        resolve(result);
                    } else {
                        reject(err);
                    }
                })
            })
        });
        return Promise.all(allPromise);
    })
    .then(function () {
        console.log('upload all')
    })
    .catch(function (error) {
        console.log(error);
    });
}

function downloadResourceFromCdn(client, folder, keypreffix, origin) {
    var baseFolder = path.resolve(folder);
    var origin = origin + '/'
    client.list(keypreffix, function (err, result) {
        if (!err) {
            result.items.map(function (file) {
                return new Promise(function (resolve, reject) {
                    client.download(file.key, function (err, content, res) {
                        if (!err) {
                            resolve(file)
                        } else {
                            reject(err)
                        }
                    })
                }).then(function (file) {
                    var fileName = path.basename(file.key)
                    var cdnFilePath = file.key
                    var url = client.saveAsURL(cdnFilePath, fileName)
                    // console.log('url======>', url)
                    //生成本地存储目录
                    var dirPath = path.dirname(url.split(origin)[1].split('?download/')[0])
                    //设置本地存储目录
                    var dir = path.join(baseFolder + '/' + dirPath);
                    //创建本地存储目录
                    mkdirp(dir, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    download('http://' + url.split('?download/')[0], dir, fileName)
                }, function (err) {
                    console.log(err)
                }).catch(function (err) {
                    console.log(err)
                })
            })
        } else {
            console.log(err)
        }
    })
}

function download(url, dir, filename) {
    request.head(url, function (err, res, body) {
        request(url).pipe(fs.createWriteStream(dir + "/" + filename));
    });
};
