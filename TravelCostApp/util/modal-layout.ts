/** Content width for modals that must not extend past the screen edges. */
export function templatePickerModalContentWidth(
  screenWidth: number,
  horizontalInset = 6
): number {
  return Math.max(0, screenWidth - horizontalInset * 2);
}
