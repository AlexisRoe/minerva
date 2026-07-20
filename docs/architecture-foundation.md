# Goal

In this phase the goal is to create a working monorepo with multiple languages and structures to start implementing the actual project.

# General structure

In this project, there will be 

- two frontend application based on react. they share some types, interfaces and ui components with each other.
- at least one nestjs backend application which shares constants, types, interfaces, request, response objects with the other two frontend applications
- for starters minimum 2 python based applications which are based on the same foundation, they will be queue based event handlers, where the main difference is the envet handler itself, the rest will be in the application frame (Python)

The backend should be build in such a way, that they can be deployed in Kubernetes in optimized docker container individually. Both Frontend and backend need to be running locally with SSL.

Additionally I need some persistent services running in docker for the backends:

- a postgres database with a read and read/write connection
- a redis instance (use Valkyr image)
- a AWS S3 instance (use locakstack 4.14 or a similar package)
- an secure image proxy (use https://github.com/cactus/go-camo)

# Notes

- all applications need to run the latest versions of their packages
- all applicaitons/packages need to be testable (use jest for all typescript projects and something similar in python)
- Typescript applications should run with Typescript 6
- Typescript appliactions should both be lintered and formatted with BiomeJS (FE + BE)
- all frontend application should run with vite and be served via https
- vscode and editor config are added
- dependebaot config for everything is added
- husky is added to automatically run all the tests, build, typecheck, linting, etc. before pushing
- the frontend applications should have secure index.html and be both also deployed as PWA applications
- there should be pipleines in Github to run in every PR for all tests and linting (per project individual pipelines ideally)
- In Github there should be a workflow that if a label is added (version:major, version:minor, version:patch), the main package.json version is increased during merging to main (and only to main)
- Python should use vu as package manager to have similar workflows as with npm
- the monorepo should be managed by NX tooling, no additional plugins being installed, if not absolutly necessary
- all projects are using Sentry

You should not implement the apps in depth, only that the setup is working and all applications are running with a hello world example.

Frontend example can be referenced here /Users/alexis/dev/running-tracker

## Editor remarks

- line length 120 characters
- use single quotes
- intend stle spaces
- intend with 2 chars

Please configure, biome, and vscode accordingly