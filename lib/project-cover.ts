const placeholders: Record<string, string> = {
  "placeholder-01": "/assets/reference-form.jpg",
  "placeholder-02": "/assets/reference-model.jpg",
  "placeholder-03": "/assets/reference-concrete.jpg",
};

export function isPlaceholderCover(key?: string) {
  return Boolean(key && Object.hasOwn(placeholders, key));
}

export function coverSource(key?: string, editor = false) {
  if (!key) return undefined;
  if (isPlaceholderCover(key)) return placeholders[key];
  return editor ? "/api/editor?image=" + encodeURIComponent(key) : "/media/" + encodeURIComponent(key);
}
