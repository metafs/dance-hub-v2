export type MainImageInput = {
  imageAlt: string | null;
  imageContentType: string | null;
  imageObjectKey: string | null;
};

export function parseMainImage(
  objectKey: string,
  contentType: string,
  altText: string,
): MainImageInput | null {
  if (
    Boolean(objectKey) !== Boolean(contentType) ||
    Boolean(objectKey) !== Boolean(altText)
  ) {
    return null;
  }
  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    return null;
  }

  return {
    imageAlt: altText || null,
    imageContentType: contentType || null,
    imageObjectKey: objectKey || null,
  };
}
