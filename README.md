# qtool

One tool to upload/download resources to/from qinniu

## install
```
sudo npm install -g qtool
```

## usage

Upload resource:

```
qtool upload  -f uploadfolder -a RSxpQIxNIS2vo0vuQR3HX701ddS9fdlUnQ5jV8ul -s xCLWczC5V5kyy7H85MNKNYcXT4wx9k5OzT7YDVFk -b mybucket -k activity -h olf3t4olk.bkt.clouddn.com
```

Download resource:

```
qtool download  -f downloadfolder -a RSxpQIxNIS2vo0vuQR3HX701ddS9fdlUnQ5jV8ul -s xCLWczC5V5kyy7H85MNKNYcXT4wx9k5OzT7YDVFk -b mybucket -k activity -h olf3t4olk.bkt.clouddn.com
```


Parameters detail:

```
-f, --folder <string> 
    Upload and download forder
    
-k, --keypreffix <string> 
    Key preffix. 
    When uploading, key preffix will insert to the front of key. 
    When downloading, key preffix will be used to filter the url in cdn.
    
-a, --accessKey <string>
    Access Key
    
-s, --secretKey <string> 
    Secret Key  
      
-b, --bucket <string>
    Upload and Download bucket of qiniu.
    
-h, --hostUrl <string>
    Qiniu host url. Will be stored when first set.
    Example: http://cdn.xxx.com    
    
```

## note
Any issue please free let me know.

# 中文版本
`qtool` 安装方法：

```
npm install -g qtool
```

上传资源:

```
qtool upload  -f uploadfolder -a RSxpQIxNIS2vo0vuQR3HX701ddS9fdlUnQ5jV8ul -s xCLWczC5V5kyy7H85MNKNYcXT4wx9k5OzT7YDVFk -b mybucket -k activity -h olf3t4olk.bkt.clouddn.com
```

下载资源:

```
qtool download  -f downloadfolder -a RSxpQIxNIS2vo0vuQR3HX701ddS9fdlUnQ5jV8ul -s xCLWczC5V5kyy7H85MNKNYcXT4wx9k5OzT7YDVFk -b mybucket -k activity -h olf3t4olk.bkt.clouddn.com
```


参数说明:

```
-f, --folder <string> 
    上传和下载目录
    
-k, --keypreffix <string> 
    上传的时候，前缀会插入到 key 的前面。
    下载的时候，前缀会被用于过滤七牛的cdn url。
    
-a, --accessKey <string>
    access Key 七牛官网获取
    
-s, --secretKey <string> 
    Secret Key 七牛官网获取
      
-b, --bucket <string>
    上传和下载对象空间
    
-h, --hostUrl <string>
    七牛 host url，比如：http://cdn.xxx.com    
    
```


