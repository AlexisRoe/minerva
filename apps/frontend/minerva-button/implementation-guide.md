# Implementation Guide

- we need the officejs cdn tag into index.html (dereffered)
- I want to use react router for the application
- the first page a user sees is the report page (see ui-lib); while its loading a loading page should be displayed. In the data load prop of react router the following has to happen:

1. we wait that officeJs is loaded and ready, check for outlook environment and requirement sets (min 1.14) > if OfficeJs does not load in max 5 seconds or its ready but not in Outlook or loaded but requirement set is not correct, a no-content-view should be rendered with the approbiate user message (i18n)
2. when officeJs is successfully loaded information about the email, the user, the environment, the host should be stored in a office zustand store
3. after that the authentication has to happen via NAA and if not working MSAL (ceck official documentation & lib). The authorization token for Graph api (check manifest) has to be accuired and than send to the backend, where its get validated and checked against Microsoft and than a 1h valid cookie is attached so every other call is authorized
4. the data coming back should be stored in a session zustand store
5. after that a settings call is made to the backednd > the successful response should be stored in a settings zustand store
6. if all is successful, the loading state is ended and the report page is rendered (there is an example in ui-lib for that, otherwise ask me)

!Important: create demo data for everything so we can mock that all

- After a user selects how to report an email and gives feedback, the reporting happens according to settings, that means:

1. via Graph api the raw email has to be downloaded
2. one or more emails have to be send, for that we have to create an email template, we need to include custom header to check that this email was send via this addon and the report id as well
3. the raw email with other data has to be uploaded to backend
4. when that is comming back, the email can be rendered and send in parallel to multiple hosts

The reporting (uploading etc.) will need time, use the router data loading thing to diplay a Loading screen (ui-lib, steps provided) and when finished the confirmations screen
   
- in the end we tell the user that the message was reported, if we identified the emial, we should tell him something about it, if contact stuff is in settings, we show a section telling the user who to contact in doubt. We tell based on reporting method and response some possible user sectiosn and two buttons on the bottom: suspicious -> Delete (move to trash) & close; spam -> Move to Spam & close

- in the ui-lib you find all screens, I prepared the request/responses (shared/typescript-lib) > if unclear ask me questions, I prepare the data for the loading screens
- There is also ErrorView which should be used to render errors in the error boundary. If Sentry is not already reporting the emails automatically, we have to do that as well manually (there is already a function for that) -> we might have to write our own ErrorBoundary (using React default components), since we need to do some stuff based on the type of Error (I want different error messages and tipps for Minerva errors and all other errors) -> check whats possible

If anything breaks expectically, create custom errors

Create a detailled plan in multiple steps, go through each step with me and clearify if that correct for now. Check official documentation and reference them in the plan.
