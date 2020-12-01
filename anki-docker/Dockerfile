FROM ubuntu:latest
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt install -y anki
EXPOSE 8765
RUN adduser anki
COPY 2055492159/ /home/anki/Anki2/addons21/2055492159/
RUN chown -R anki:anki /home/anki/Anki2/
USER anki
ENTRYPOINT ["/usr/bin/anki", "--base"]
CMD ["/home/anki/Anki2"]