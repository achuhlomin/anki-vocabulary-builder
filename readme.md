## Setup

https://github.com/FooSoft/anki-connect  

1. Run `make build`
2. Run `make ankid name=<telegram_username>`
3. Manually sync user's ankiweb
4. Create 'Vocabulary Builder' desk from `./model` template
4. Set up envs

        export BOT_TOKEN=<TELEGRAM_BOT_TOKEN>
        export TRANSLATOR_TOKEN=<AZURE_TRANSLATOR_TOKEN>
        export STUDENT_LANG=ru
     
5. Run `npm run bot`