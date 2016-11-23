# install uwsgi and nginx in python3
FROM tiangolo/uwsgi-nginx:python3.5

COPY nginx.conf /etc/nginx/conf.d/

# install geo packages
RUN apt-get update -y
RUN apt-get install -y libgdal-dev

WORKDIR /app

# install python dependencies
COPY ./requirements.txt /app
RUN pip3 install -r requirements.txt
ENV PORT 80
COPY . /app
