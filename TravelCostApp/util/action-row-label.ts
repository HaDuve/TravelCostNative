import React from "react";

/** Derives an ActionRow label from legacy Button children (plain text). */
export function actionRowLabelFromChildren(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(actionRowLabelFromChildren).join("");
  }
  if (React.isValidElement(children)) {
    return actionRowLabelFromChildren(children.props.children);
  }
  return "";
}
