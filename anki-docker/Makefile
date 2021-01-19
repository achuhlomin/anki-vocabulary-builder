help:
	@echo "Examples:"
	@echo " make all id=369837507	Create anki container for achuhlomin"
	@echo " make all id=339253577	Create anki container for amashyr"

build:
	docker build --tag anki:local .

# https://medium.com/@benjamin.botto/opengl-and-cuda-applications-in-docker-af0eece000f1
# You need `nvidia-container-toolkit` on the host
# `--gpus all` at docker run
# and glvnd, X11 dependencies in container (see Dockerfile)
gui:
	docker rm gui-anki-$(id) | true
	docker run -it \
		--gpus all \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-e DISPLAY=unix${DISPLAY} \
		--name gui-anki-$(id) \
		anki:local

base:
	docker commit gui-anki-$(id) anki-$(id)

ankid:
	docker run \
		-d \
		-e QT_QPA_PLATFORM=minimal \
		--name ankid-$(id) \
		anki-$(id)
	docker container stop ankid-$(id)
	docker commit ankid-$(id) ankid-$(id)

all: build gui base ankid