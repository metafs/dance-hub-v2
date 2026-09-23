"use client";

import { useEffect, type RefObject } from "react";

/**
 * After a submission comes back with errors, move focus to the first invalid
 * field, or to the error summary when no field is marked. The form re-renders
 * in place, so without this the keyboard focus is left on the page body and a
 * keyboard or screen-reader user has to search for what went wrong.
 */
export function useFocusFirstError(
  container: RefObject<HTMLElement | null>,
  hasErrors: boolean,
  revision: unknown,
) {
  useEffect(() => {
    if (!hasErrors || !container.current) return;
    const target = container.current.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?? container.current.querySelector<HTMLElement>("[data-error-summary]");
    target?.focus();
  }, [container, hasErrors, revision]);
}
