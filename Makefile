help:
	@echo "Available targets:"
	@echo " build                                   Builds anki:local image"
	@echo " user_gui name=<username>				Runs anki:<username> gui to sync"
	@echo " user_image name=<username>				Commits anki:<username> image"
	@echo " ankid name=<username>					Runs anki:<username> daemon"

build:
	docker build --tag anki:local .

gui:
	docker run -it \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-e DISPLAY=unix${DISPLAY} \
		--name anki_$(name) \
		anki:local

image: gui
	docker commit anki_$(name) anki:$(name)
	docker container rm anki_$(name)

ankid:
	docker run \
		-d \
		-e QT_QPA_PLATFORM=minimal \
		--name anki_$(name) \
		anki:$(name)