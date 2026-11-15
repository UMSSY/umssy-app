import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

export const API_DOCS_PATH = '/docs';

const apiHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
});

const docsHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
});

const isDocsRequest = (path: string) =>
  path === API_DOCS_PATH || path.startsWith(`${API_DOCS_PATH}/`);

export function securityHeaders(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const middleware = isDocsRequest(request.path) ? docsHeaders : apiHeaders;
  middleware(request, response, next);
}
