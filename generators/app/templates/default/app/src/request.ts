import got, { RequestError } from 'got';
import type {
    Got,
    ExtendOptions,
    GeneralError,
    GotError,
    HTTPError,
    MaxRedirectsError,
    ParseError,
} from 'got';

import { createLogger } from '@common/Logger';
const log = createLogger('request');

type ErrorWithReponse = HTTPError | MaxRedirectsError | ParseError;

function hasErrorResponse(error: GeneralError): error is ErrorWithReponse {
    return Object.prototype.hasOwnProperty.call(error, 'response');
}

function isGotError(error: GeneralError): error is GotError {
    return Object.prototype.hasOwnProperty.call(error, 'options');
}

interface IErrorInfo {
    url?: string;
    retryCount?: number;
    statusCode?: number;
    statusMessage?: string;
}

export class CustomRequestError extends RequestError {
    constructor(error: GotError, public info: IErrorInfo) {
        super(error, error.options);
    }
}

const base = got.extend({
    retry: 0,
    hooks: {
        beforeRequest: [
            ({ method, url }) => {
                log.info({
                    hook: 'beforeRequest',
                    url: url.toString(),
                    method,
                });
            },
        ],
        beforeRetry: [
            (options, error, retryCount) => {
                let statusCode;
                let statusMessage;

                if (error && hasErrorResponse(error)) {
                    statusCode = error.response.statusCode;
                    statusMessage = error.response.statusMessage;
                }

                log.warn({
                    hook: 'beforeRetry',
                    url: options.url.toString(),
                    retryCount,
                    statusCode,
                    statusMessage,
                });
            },
        ],
        afterResponse: [
            (response) => {
                log.info({
                    hook: 'afterResponse',
                    url: response.requestUrl,
                    retryCount: response.retryCount,
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                });
                return response;
            },
        ],
        beforeError: [
            (error: GeneralError) => {
                const info: IErrorInfo = {};

                if (hasErrorResponse(error)) {
                    const response = error.response;
                    info.url = response.requestUrl;
                    info.retryCount = response.retryCount;
                    info.statusCode = response.statusCode;
                    info.statusMessage = response.statusMessage;
                }

                // Подразумевается, что ошибку обрабатывает код,
                // использующий эту базовую декларацию запроса.
                log.info({
                    hook: 'beforeError',
                    info,
                });

                if (isGotError(error)) {
                    return new CustomRequestError(error, info);
                }

                return error;
            },
        ],
    },
});

/**
 * @example
 * ```
 * import { createRequest, CustomRequestError } from './request';
 * const got = createRequest({
 *     prefixUrl: 'http://localhost:4001',
 *     timeout: 2000,
 *     retry: 3,
 * });
 * got(`securities/${symbol}.json`)
 *     .json<IResponse>()
 *     .then((data: IResponse) => console.log(data));
 * ```
 */
export function createRequest(options: ExtendOptions): Got {
    return got.extend(base, options);
}
