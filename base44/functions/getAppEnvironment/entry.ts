/**
 * Returns the active database environment (Test vs Production).
 *
 * The Base44 gateway sets the `x-data-env` request header to "dev" while the
 * builder is in Test mode and "prod" otherwise (including published apps).
 * We expose that to the frontend so it can show an environment badge and
 * give accurate empty-state messaging.
 */
Deno.serve(async (req) => {
  const raw = req.headers.get('x-data-env');
  const environment = raw === 'dev' ? 'dev' : 'prod';
  return Response.json({
    environment,
    isTest: environment === 'dev',
    label: environment === 'dev' ? 'Test' : 'Production',
  });
});