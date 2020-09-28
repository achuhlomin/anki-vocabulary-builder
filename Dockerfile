FROM ubuntu:latest
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update
RUN apt install -y anki
RUN adduser anki
EXPOSE 8765
USER anki
CMD ["anki", "-c", "/usr/bin/anki --base ~/Anki2"]