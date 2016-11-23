To build and run in Docker

```
docker build -t vptas-flask-app:latest .
docker run -d -p 80:80 -e "PORT=80" vptas-flask-app
# or in dev

docker run -d -p 80:80 -e "PORT=80" -v `pwd`:/app vptas-flask-app

# NOTE: you may need to remove the old container by runnig
# docker ps -a -f "status=exited" --format "{{.ID}}" | xargs docker rm

# to debug
# over write entry point
docker run -d -p 80:80 -e "PORT=80" -v `pwd`:/app --entrypoint bash vptas-flask-app

# to connect to running container in interactive mode
docker exec -it <container-id>  bash
```
