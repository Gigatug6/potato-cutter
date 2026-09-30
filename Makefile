.PHONY: init build install dev up down logs check typecheck test e2e sh npm clean

init:       ## génère .env (UID/GID) et build l'image
	./scripts/init-env.sh
	docker compose build

build: init

install:    ## npm install dans Docker
	./scripts/npm.sh install

dev:        ## serveur de dev (http://localhost:5173)
	./scripts/dev.sh

up:         ## serveur de dev en arrière-plan
	docker compose up -d --wait app

down:
	docker compose down

logs:
	docker compose logs -f app

check:      ## typecheck + tests + build
	./scripts/check.sh

typecheck:
	./scripts/npm.sh run typecheck

test:
	./scripts/npm.sh test

e2e:        ## tests Playwright
	./scripts/e2e.sh

sh:         ## shell dans le conteneur
	docker compose run --rm app bash

npm:        ## make npm ARGS="install foo"
	./scripts/npm.sh $(ARGS)

clean:      ## supprime conteneurs et volume node_modules
	docker compose --profile e2e down -v
