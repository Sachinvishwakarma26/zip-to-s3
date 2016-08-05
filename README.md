# zip-to-s3

zip-to-s3 is a little module for uploading a zip file to AWS S3.

```javascript

var zs3 = require('zip-to-s3');

zs3({
    credentials: {
        "accessKeyId": "ABCD1234ABCD1234ABCD",
        "secretAccessKey": "ABCD1234abcd+abc123ABC123ABCD123ABC123ab"
    },
    file: '/path/to/file.zip',
    bucket: 'my-bucket-name',
    prefix: '',
    progress: function(task, amount) {
        console.log(task, amount);
    }
}).then(function() {
    console.log('Done!');
}).catch(function(e) {
    console.log(e);
});

```

## Parameters

`prefix` and `progress` are optional parameters. 

`prefix` will be prepended to the filenames in the zip. For example, a zip file
containing `index.html` and `logo.png`, being uploaded to the bucket `mybucket`
with prefix `myprefix` will have these targets:

- `http://s3.amazonaws.com/mybucket/myprefix/index.html`
- `http://s3.amazonaws.com/mybucket/myprefix/logo.png`

`progress` is a callback of the form `function(task, amount)`. `task` is a string
representing which phase of the upload is active, while `amount` is a number
representing the progress of that phase, or `undefined` if that phase does not
track progress.

## Uploading a compressed directory

If zip-to-s3 is passed a zip file that contains _exactly one directory_ at the 
root level and _no files_, it will upload the contents of that root directory
directly to the bucket. To illustrate

```
# example1.zip
mydir/index.html
mydir/logo.png

# example2.zip
index.html
logo.png

# example3.zip
mydir/index.html
mydir/logo.png
test.txt
```

example1.zip and example2.zip will both upload index.html to 
`/mybucket/index.html`, while example3.zip will have it at `mybucket/mydir/index.html`.

This is just to account for the fact that some methods of compressing a single
directory will include that directory as the root, while some will just include
its contents.
