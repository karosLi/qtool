#!/usr/bin/env node

/**
 * @file qtool.js
 * @author karos
 */

var fs = require('fs');
var path = require('path');
var util = require('util')
var Promise = require('promise');
var co = require("co");
var thunkify = require("thunkify");

var program = require('commander');
var mkdirs = require('node-mkdirs');
var glob = require('glob');

var readdir = thunkify(glob);

(function() {
  program.version('0.0.1')
    .usage('One tool to upload resource to qinniu')
    .option('-f, --folder <string>', 'Image forder')
    .option('-a, --accessKey <string>', 'Access Key')
    .option('-s, --secretKey <string>', 'Secret Key')
    .option('-b, --bucket <string>', 'Bucket to store image')
    .parse(process.argv)

    var accessKey = program.accessKey;
    var secretKey = program.secretKey;
    var bucket = program.bucket;
    var folder = program.folder;

    if (typeof(folder) === 'undefined') {
      console.log('Missing parameter folder');
      return;
    }

    if (typeof(accessKey) === 'undefined') {
      console.log('Missing parameter accessKey');
      return;
    }

    if (typeof(secretKey) === 'undefined') {
      console.log('Missing parameter secretKey');
      return;
    }

    if (typeof(bucket) === 'undefined') {
      console.log('Missing parameter bucket');
      return;
    }

    uploadImageToCdn(folder, accessKey, secretKey, bucket);
})();

function* getImagesPath(folder) {
  var pattern = folder + '/**/*.{jpg,png,svg}';
  var files = yield readdir(pattern, {nodir: true, realpath: true});

  return files;
}

function uploadImage(accessKey, secretKey) {
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

function uploadImageToCdn(foler, accessKey, secretKey, bucket) {
  var upload = uploadImage(accessKey, secretKey);

  co(getImagesPath(foler)).then(function(files) {
    var baseFolder = foler;
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
