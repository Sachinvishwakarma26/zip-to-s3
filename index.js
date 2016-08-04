var s3 = require('s3');
var unzip = require('unzip2');
var tmp = require('tmp');
var fs = require('fs');
var path = require('path');

function createTmpDir() {
    return new Promise(function(resolve, reject) {
        tmp.dir(function(err, path, cleanup) {
            if(err) {
                reject(err);
            } else {
                resolve({
                    path: path,
                    cleanup: cleanup
                });
            }
        }, { unsafeCleanup: true });
    });
}

function extract(file, target) {
    return new Promise(function(resolve, reject) {
        var pipe = fs.createReadStream(file).pipe(unzip.Extract({
            path: target 
        }));
        pipe.on('error', function(e) {
            reject(e);
        });
        pipe.on('close', function(evt) {
            resolve(evt);
        });
    });
}

function getDirToSync(dir) {
    // if zip has been extracted as a single directory,
    // sync the contents of *that* directory
    var contents = fs.readdirSync(dir);
    if(contents.length === 1) {
        var innerpath = path.join(dir, contents[0]);
        var stat = fs.statSync(innerpath);
        if(stat.isDirectory()) {
            return innerpath;
        }
    }
    return dir;
}

function syncDir(client, dir, bucket, prefix, progress) {
    return new Promise(function(resolve, reject) {
        var uploader = client.uploadDir({
            localDir: getDirToSync(dir),
            deleteRemoved: true,
            defaultContentType: 'text/html',
            ACL: 'public-read',
            s3Params: {
                Bucket: bucket,
                Prefix: prefix || ''
            }
        });

        uploader.on('error', reject);
        uploader.on('end', resolve);

        var lastProgress = 0;
        uploader.on('progress', function() {
            var p = uploader.progressAmount;
            if(lastProgress < p) {
                lastProgress = p;
                var pct = p * 1.0 / uploader.progressTotal;
                progress('Uploading', uploader.progressAmount);
            }
        });

    });
};

module.exports = function(options) {
    var progress = options.progress || function(task, amount) { };

    var state = {};

    return createTmpDir().then(function(d) {
        state.dir = d;
    }).then(function() {
        progress('Unzipping');
        return extract(options.file, state.dir.path);
    }).then(function() {
        progress('Uploading', 0);
        state.client = s3.createClient({ s3Options: options.credentials });
        return syncDir(
            state.client,
            state.dir.path,
            options.bucket, 
            options.prefix, 
            progress
        );
    }).then(function() {
        progress('Cleaning up');
        state.dir.cleanup();
    });
};
