aws s3 sync /var/lib/couchdb/1.2.0  s3://S3-BUCKET --exclude="deleted*" > sync.log 2>&1 &
