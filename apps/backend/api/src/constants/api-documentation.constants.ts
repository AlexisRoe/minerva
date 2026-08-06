/** Where the rendered Swagger UI is served from. */
export const SWAGGER_UI_PATH = 'docs';

/** Where the raw OpenAPI document is served from, for tooling that wants JSON rather than a page. */
export const SWAGGER_JSON_PATH = `${SWAGGER_UI_PATH}/json`;

/** The browser tab title of the Swagger UI, so a tab parked among others still says which api it documents. */
export const SWAGGER_SITE_TITLE = 'Minerva API — Documentation';
