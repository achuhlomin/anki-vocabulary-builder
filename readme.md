## Setup

https://github.com/FooSoft/anki-connect  

### Set up anki image

1. `make build`
2. `make run_local`
3. Install `Anki Connect` (Tools > Addons > Get Addons > 2055492159)
4. Configure addon `"webBindAddress": "0.0.0.0"`
5. `make commit_connect`
    
### Set up user's anki

1. `make run_connect`
2. Sync anki with user's web anki
3. `make commit_user name=<username>`
    
### Test
    
    curl localhost:8765 -X POST -d "{ \"action\": \"sync\", \"version\": 6 }"