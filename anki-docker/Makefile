help:
	@echo "Available targets:"
	@echo " build                                   Builds anki:local image"
	@echo " gui name=<id>							Runs anki:<id> gui to sync"
	@echo " image name=<id>							Commits anki:<id> image"
	@echo " ankid name=<id>							Runs anki:<id> daemon"

build:
	docker build --tag anki:local .

gui:
	docker run -it \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-e DISPLAY=unix${DISPLAY} \
		--name test_anki_$(id) \
		anki:local

image:
	docker commit anki_$(id) anki:$(id)
	docker container rm anki_$(id)

ankid:
	docker run \
		-d \
		-e QT_QPA_PLATFORM=minimal \
		--name anki_$(id) \
		--network anki-vocabulary \
		anki:$(id)

update:
	docker commit anki_$(id) anki:$(id)
	docker container stop anki_$(id)
	docker container rm anki_$(id)
	docker run -it \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-e DISPLAY=unix${DISPLAY} \
		-e QT_QPA_PLATFORM=xcb \
		--name anki_$(id) \
		anki:$(id)
	docker container stop anki_$(id)
	docker commit anki_$(id) anki:$(id)
	docker container rm anki_$(id)
	docker run \
    		-d \
    		-e QT_QPA_PLATFORM=minimal \
    		--name anki_$(id) \
    		anki:$(id)
