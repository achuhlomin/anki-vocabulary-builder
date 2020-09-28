help:
	@echo "Available targets:"
	@echo " build                                   Builds anki:local image"
	@echo " run_local                               Runs anki:local container"
	@echo " commit_connect                          Commits anki:connect image"
	@echo " run_connect                             Runs anki:connect container"
	@echo " commit_user name=<username>             Commits anki:<name> image"
	@echo " run_user name=<username> port=<port>    Runs anki:<name> container"

build:
	docker build --tag anki:local .

run_local:
	docker run -d \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-e DISPLAY=unix${DISPLAY} \
		--name anki_local \
		anki:local

commit_connect:
	docker commit anki_local anki:connect

run_connect:
	docker run -it \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		--name anki_connect \
		anki:connect

commit_user:
	docker commit anki_connect anki:$(name)

run_user:
	nohup docker run \
		-e QT_QPA_PLATFORM=minimal \
		-p $(port):8765 \
		anki:$(name) &