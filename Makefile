help:
	@echo "Available targets:"
	@echo " build		Builds docker image"
	@echo " run  		Runs docker container"

build:
	docker build --tag anki:local .

local:
	docker run -it \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-e DISPLAY=unix${DISPLAY} \
		anki:local

connect:
	docker run -it \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		anki:connect

andrewchuhlomin:
	docker run \
		-e QT_QPA_PLATFORM=minimal \
		-p 8765:8765 \
		anki:andrewchuhlomin

aksana_nanana:
	docker run \
		-e QT_QPA_PLATFORM=minimal \
		-p 8766:8765 \
		anki:aksana_nanana