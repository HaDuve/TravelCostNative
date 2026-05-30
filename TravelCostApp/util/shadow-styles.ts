type StyleObject = Record<string, unknown>;

function flattenStyle(style: StyleObject | StyleObject[] | undefined): StyleObject {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<StyleObject>(
      (merged, part) => ({ ...merged, ...flattenStyle(part) }),
      {}
    );
  }
  return style;
}

export function styleHasShadow(style: StyleObject): boolean {
  const flat = flattenStyle(style);
  return (
    flat.shadowColor != null ||
    flat.shadowOpacity != null ||
    flat.shadowRadius != null ||
    flat.shadowOffset != null ||
    (typeof flat.elevation === "number" && flat.elevation > 0)
  );
}

export function assertSolidBackgroundForShadow(style: StyleObject): void {
  const flat = flattenStyle(style);
  if (!styleHasShadow(flat)) return;

  const backgroundColor = flat.backgroundColor;
  if (
    backgroundColor == null ||
    backgroundColor === "transparent" ||
    backgroundColor === ""
  ) {
    throw new Error(
      "Views with shadow props require a solid backgroundColor on the same style object"
    );
  }
}
