   # 1. docker-compose for all services

   I want a docker-compose script which runs all services (database, cache, localstack, image proxy) + the python workers + the api in docker. The api needs to be exposed via https, the rest of the services does not need that (but it doesn#t hurt). Frontend does that already. The existing certs can be reused. Check the python micro services, they are crashing all the time in docker.

   - check also that database, valkyr are persistent 

   You started yesterday already. Check the decision to use nginx directly.

   You developed something similar already, here is the example

   # 2. Dependencies

   ALL dependencies, in package.json, pyproject.toml or docker images, need to be pinned to a specific version. Check for the latest packages in Python and NodeJs, update the dependencies accordingly to the latest possible versions. Please check if the depdendencies added by nx can be updated as well.

   - Keep Typescript on version 6.
   - Why does some dependencies appear twice
   - Keep types node on the latest version for tehe node version of this project
   - do not update JSDOM (it will not work in the current setup for Jest)
  