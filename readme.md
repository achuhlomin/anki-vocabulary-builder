## Setup

https://github.com/FooSoft/anki-connect  

1. Run `make redis`
1. Run `make build`
1. Run `make ankid name=<telegram_username>`
1. Manually sync user's ankiweb
1. Create 'Vocabulary Builder' desk from `./model` template
1. Set up envs

        export BOT_TOKEN=<TELEGRAM_BOT_TOKEN>
        export TRANSLATOR_TOKEN=<AZURE_TRANSLATOR_TOKEN>
        export STUDENT_LANG=<AZURE_TRANSLATOR_LANG>

1. Run `npm run bot`