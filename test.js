var zip_to_s3 = require('./');

try {
    var s3 = require('./s3-creds');
} catch(err) {
    console.log("You'll need to save some AWS credentials to s3-creds.json, with valid 'accessKeyId' and 'secretAccessKey' keys, before you can test this.");
    return;
}

var filename = 'file.zip';
var bucket = 'testbucket';
var prefix = 'testing_zip';
var progress = function(task, amount) {
    console.log(task, amount || '');
};

zip_to_s3(s3, filename, bucket, prefix, progress);
