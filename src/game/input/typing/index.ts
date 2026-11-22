/**
 * Is this key going into a field? The game listens on the window, so the
 * name form on the post-run board would lose WASD, the arrows and Space.
 */
export const isTyping = (event: KeyboardEvent): boolean => {
  const { target } = event;
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
};
