Painter Bros
=======================

Commands:

    npm run build    # single run compile
    npm run watch    # file watcher & re-build
    npm run deploy   # deploy website

If you want to build all the files for deployment, run the first command.
If you are doing active development, run the second command, then 

## Deploy to S3

Set AWS Credentials and run `npm run deploy`.

Two options to set the credentials:

  1. As the standard AWS environment variables (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`)
  2. Create a `.env` file with values set: e.g.

        AWS_ACCESS_KEY_ID=<access key id>
        AWS_SECRET_ACCESS_KEY=<secret access key>
