// core/error.response.js
import { StatusCodes, ReasonPhrases } from '../utils/httpStatusCode.js'; 

const StatusCode = {
    OK: StatusCodes.OK, 
    CREATED: StatusCodes.CREATED,
    BAD_REQUEST: StatusCodes.BAD_REQUEST, // 400
    FORBIDDEN: StatusCodes.FORBIDDEN,     // 403
    CONFLICT: StatusCodes.CONFLICT,       // 409
    UNAUTHORIZED: StatusCodes.UNAUTHORIZED // 401
};

const ReasonStatusCode = {
    OK: 'Success',
    CREATED: 'Created',
    BAD_REQUEST: 'Bad request error',
    FORBIDDEN: 'Forbidden error',
    CONFLICT: 'Conflict error',
    UNAUTHORIZED: 'Unauthorized error'
};

class ErrorResponse extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message = ReasonStatusCode.CONFLICT, statusCode = StatusCode.CONFLICT) {
        super(message, statusCode);
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = ReasonStatusCode.BAD_REQUEST, statusCode = StatusCode.BAD_REQUEST) { // Fixed statusCode
        super(message, statusCode);
    }
}

class UnauthorizedError extends ErrorResponse {
    constructor(message = ReasonPhrases.UNAUTHORIZED, statusCode = StatusCodes.UNAUTHORIZED) {
        super(message, statusCode);
    }
}

class AuthFailureError extends ErrorResponse {
    constructor(message = ReasonPhrases.UNAUTHORIZED, statusCode = StatusCodes.UNAUTHORIZED) {
        super(message, statusCode);
    }
}

class NotFoundError extends ErrorResponse {
    constructor(message = ReasonPhrases.NOT_FOUND, statusCode = StatusCodes.NOT_FOUND) {
        super(message, statusCode);
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(message = ReasonPhrases.FORBIDDEN, statusCode = StatusCodes.FORBIDDEN) {
        super(message, statusCode);
    }
}

export {
    ConflictRequestError,
    BadRequestError,
    NotFoundError,
    AuthFailureError,
    ForbiddenError,
    UnauthorizedError 
};
