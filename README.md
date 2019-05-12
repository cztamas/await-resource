#await-resource

Simple utility tool which polls a resource (e.g. a database) until it is up. Useful e.g. in dev startup scripts.
Currently only usable from npm scripts (or the command line), and works only for resources running in Docker containers.

E.g. `await-resource --pg my-postgres-container-name-1  --pg my-postgres-container-name-2 --timeout 20000` waits until the postgres instances running in the docker containers named 'my-postgres-container-name-1' and 'my-postgres-container-name-2' are BOTH up, or until the timeout of (20000ms = 20s) runs out - it throws an error in the latter case.

## Usage

### Postgres
`await-resource --pg CONTAINER_NAME`
### RabbitMQ
`await-resource --rabbit CONTAINER_NAME`
### Redis
`await-resource --redis CONTAINER_NAME`
### MongoDB
`await-resource --mongo CONTAINER_NAME`
### URLs
`await-resource --url SOME_URL` polls the given URL until it returns a 2xx status code.

### Configuration
You can wait for any number of resources in any combination in one command.
The default polling interval is 500ms, you can override it with e.g. `--interval 100`.
The default timeout value is 120000ms (2 minutes), you can override it with e.g. `--timeout 10000`.
