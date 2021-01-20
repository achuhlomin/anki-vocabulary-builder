FROM ubuntu:20.04

# https://medium.com/@benjamin.botto/opengl-and-cuda-applications-in-docker-af0eece000f1

# Env vars for the nvidia-container-runtime.
ENV NVIDIA_VISIBLE_DEVICES all
ENV NVIDIA_DRIVER_CAPABILITIES graphics,utility,compute

# Dependencies for glvnd, X11 and anki
RUN apt-get update \
  && apt-get install -y -qq --no-install-recommends \
    libglvnd0 \
    libgl1 \
    libglx0 \
    libegl1 \
    libxext6 \
    libx11-6 \
    anki \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 8765
RUN adduser anki
COPY 2055492159/ /home/anki/Anki2/addons21/2055492159/
RUN chown -R anki:anki /home/anki/Anki2/
USER anki
ENTRYPOINT ["/usr/bin/anki", "--base"]
CMD ["/home/anki/Anki2"]