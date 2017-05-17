#!/usr/bin/env node

/**
 * @file qtool.js
 * @author karos
 */

var os = require('os');
var fs = require('fs');
var path = require('path');
var util = require('util')
var Promise = require('promise');
var co = require("co");
var thunkify = require("thunkify");

var program = require('commander');
var glob = require('glob');

var readdir = thunkify(glob);

(function() {
  program.version('0.0.5')
    .usage('One tool to upload resource to qinniu')
    .option('-f, --folder <string>', 'Image forder')
    .option('-a, --accessKey <string>', 'Access Key. Will be stored when first set')
    .option('-s, --secretKey <string>', 'Secret Key. Will be stored when first set')
    .option('-b, --bucket <string>', 'Bucket to store image. Will be stored when first set')
    .parse(process.argv)

    var accessKey = program.accessKey;
    var secretKey = program.secretKey;
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

    folder = path.resolve(folder);
    if (isUndifined(bucket) && isUndifined(qtoolJson[folder])) {
      console.log('Missing parameter bucket');
      return;
    } else if (!isUndifined(bucket)) {
      qtoolJson[folder] = bucket;
      needUpdateKey = true;
    }

    needUpdateKey && writeKey(qtoolJson);
    uploadResourceToCdn(folder, qtoolJson.accessKey, qtoolJson.secretKey, qtoolJson[folder]);
})();

function* getResourcesPath(folder) {
  var pattern = folder + '/**/*.{jpg,png,svg,html,js,css}';
  var files = yield readdir(pattern, {nodir: true, realpath: true});

  return files;
}

function uploadResource(accessKey, secretKey) {
  var qiniu = require("qiniu");
  //需要填写你的 Access Key 和 Secret Key
  qiniu.conf.ACCESS_KEY = accessKey;
  qiniu.conf.SECRET_KEY = secretKey;

  return function(filePath, keyName, bucketName) {
    return new Promise(function(resolve, reject) {
     //要上传的空间
     var bucket = bucketName;

     //上传到七牛后保存的文件名
     var key = keyName;
     //构建上传策略函数
     function uptoken(bucket, key) {
       var putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key);
       return putPolicy.token();
     }
     //生成上传 Token
     var token = uptoken(bucket, key);
     //要上传文件的本地路径
     var localFile = filePath;

     //上传
     var extra = new qiniu.io.PutExtra();
     qiniu.io.putFile(token, key, localFile, extra, function(err, ret) {
       if(!err) {
         // 上传成功， 处理返回值
         console.log(ret.hash, key, 'successed');
         resolve(key + ' ' + ret.hash);
       } else {
         // 上传失败， 处理返回代码
         console.log(err, 'failed');
         reject(err);
       }
     });
    });
  }
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

function uploadResourceToCdn(folder, accessKey, secretKey, bucket) {
  var upload = uploadResource(accessKey, secretKey);
  var baseFolder = path.resolve(folder);

  co(getResourcesPath(baseFolder)).then(function(files) {
    var allPromise = files.map(function(file) {
      var filePath = file;
      var index = file.indexOf(baseFolder) + baseFolder.length + 1;
      var keyName = file.substring(index);

      return upload(filePath, keyName, bucket);
    });

    return allPromise;
  }).then(function() {

  }).catch(function(error) {
    console.log(error);
  });
}
