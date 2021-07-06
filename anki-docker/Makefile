help:
	@echo "Examples:"
	@echo " make all id=369837507	Create anki container for achuhlomin"
	@echo " make all id=339253577	Create anki container for amashyr"

build:
	docker build --tag anki:local .

# https://medium.com/@benjamin.botto/opengl-and-cuda-applications-in-docker-af0eece000f1
# https://aur.archlinux.org/packages/nvidia-container-toolkit/
# You need `nvidia-container-toolkit` on the host
# https://github.com/ericspod/DicomBrowser/issues/3#issuecomment-732355357
# Run `xhost +local:docker` to fix `qt: could not connect to display unix:0`
# `--gpus all` at docker run
# and glvnd, X11 dependencies in container (see Dockerfile)
gui:
	docker rm gui-anki-$(id) | true
	docker run \
		--gpus all \
		--device /dev/nvidia0 \
		--device /dev/nvidia-uvm \
		--device /dev/nvidia-uvm-tools \
		--device /dev/nvidiactl \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-e DISPLAY=unix${DISPLAY} \
		--name gui-anki-$(id) \
		anki:local

base:
	docker commit gui-anki-$(id) anki-$(id)

ankid:
	docker stop ankid-$(id) | true
	docker rm ankid-$(id) | true
	docker run \
		-d \
		-p 8765:8765 \
		-e QT_QPA_PLATFORM=minimal \
		--name ankid-$(id) \
		anki-$(id)

commit:
	docker container stop ankid-$(id)
	docker commit ankid-$(id) ankid-$(id)

all: build gui base ankid commit