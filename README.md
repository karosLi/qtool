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


