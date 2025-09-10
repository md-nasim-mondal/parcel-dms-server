import type {
  TErrorSources,
  TGenericErrorResponse,
} from "../interfaces/error.types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handleZodError = (err: any): TGenericErrorResponse => {
  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue: any) => {
    errorSources.push({
      // ? "nickname inside last inside name"
      // path: issue.path.length > 1 && issue.path.reverse().join(" inside")
      path: issue.path[issue.path.length - 1],
      message: issue.message,
    });
  });
  return {
    statusCode: 400,
    message: "Zod Error",
    errorSources,
  };
};
