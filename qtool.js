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
var mkdirs = require('node-mkdirs');
var program = require('commander');
var path = require('path');
var qn = require('qn');
var glob = require('glob');
var thunkify = require("thunkify");
var readdir = thunkify(glob);

(function () {
    program.version('0.1.0')
        .usage('One tool to upload resource to qinniu')
        .option('-f, --folder <string>', 'Resource forder')
        .option('-k, --keypreffix <string>', 'Key preffix')
        .option('-a, --accessKey <string>', 'Access Key. Will be stored when first set')
        .option('-s, --secretKey <string>', 'Secret Key. Will be stored when first set')
        .option('-b, --bucket <string>', 'Bucket to store image. Will be stored when first set')
        .option('-h, --hostUrl <string>', 'Qiniu host url. Will be stored when first set. Example:http://cdn.xxx.com')

    program.command('upload')
        .description('upload files to cdn')
        .action(function () {
            init(uploadResourceToCdn);
    });
    program.command('download')
        .description('download files from cdn')
        .action(function () {
            init(downloadResourceFromCdn);
    });
    program.parse(process.argv);
})();

function init(fn) {
    var accessKey = program.accessKey;
    var secretKey = program.secretKey;
    var keypreffix = program.keypreffix;
    var hostUrl = program.hostUrl;
    var bucket = program.bucket;
    var folder = program.folder;

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

    if (isUndifined(bucket) && isUndifined(qtoolJson.bucket)) {
        console.log('Missing parameter bucket');
        return;
    } else if (!isUndifined(bucket)) {
        qtoolJson.bucket = bucket;
        needUpdateKey = true;
    }

    if (isUndifined(hostUrl) && isUndifined(qtoolJson.hostUrl)) {
        console.log('Missing parameter hostUrl');
        return;
    } else if (!isUndifined(hostUrl)) {
        qtoolJson.hostUrl = hostUrl;
        needUpdateKey = true;
    }

    needUpdateKey && writeKey(qtoolJson);
    var client = qn.create({
        accessKey: qtoolJson.accessKey,
        secretKey: qtoolJson.secretKey,
        bucket: qtoolJson.bucket,
        origin: qtoolJson.hostUrl
    })

    folder = path.resolve(folder);
    fn && fn(client, folder, keypreffix)
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
                        console.log(result.key, 'upload successed');
                        resolve(result);
                    } else {
                        console.log(result.key, 'upload failed');
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

function downloadResourceFromCdn(client, folder, keypreffix) {
    var baseFolder = path.resolve(folder);
    client.list(keypreffix, function (err, result) {
        if (!err) {
            result.items.map(function (file) {
                return new Promise(function (resolve, reject) {
                    client.download(file.key, function (err, content, res) {
                        if (!err) {
                            console.log(file.key, 'download successed');
                            resolve(content)
                        } else {
                            console.log(file.key, 'download failed');
                            reject(err)
                        }
                    })
                }).then(function (content) {
                  return new Promise(function (resolve, reject) {
                    var dir = path.join(baseFolder, file.key);
                    // 创建本地存储目录
                    mkdirs(path.dirname(dir));

                    fs.writeFile(dir, content, function(err) {
                        if (!err) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                  });
                }, function () {
                }).catch(function (err) {
                    console.log(err)
                })
            })
        } else {
            console.log(err)
        }
    })
}
